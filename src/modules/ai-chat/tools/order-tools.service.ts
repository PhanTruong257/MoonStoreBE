import { Injectable, Logger } from '@nestjs/common';

import { PRODUCT_STATUS, PAYMENT_METHOD } from '../../../common/constants';
import { decimalToNumberOrZero } from '../../../common/utils/decimal.helper';
import { PrismaService } from '../../../prisma/prisma.service';
import { VouchersService } from '../../vouchers/vouchers.service';
import { EmbeddingService } from '../embedding.service';
import { VectorStoreService } from '../vector-store.service';
import type { OrderDraft, OrderDraftItem } from '../dto/order-draft.dto';

const SEARCH_TOP_K = 8;
const SEARCH_MAX_RESULTS = 5;
const VALID_PAYMENT_METHODS: string[] = [
  PAYMENT_METHOD.VNPAY,
  PAYMENT_METHOD.QR,
  PAYMENT_METHOD.COD,
];

type ToolArgs = Record<string, unknown>;
type ToolResult = Record<string, unknown>;

/**
 * Thực thi các tool mà Gemini gọi trong luồng trợ lý đặt hàng.
 * Mỗi tool chỉ ĐỌC dữ liệu hoặc tạo BẢN NHÁP — không bao giờ ghi đơn thật.
 * Tool đụng dữ liệu cá nhân luôn nhận userId rõ ràng (lấy từ JWT ở controller).
 */
@Injectable()
export class OrderToolsService {
  private readonly logger = new Logger(OrderToolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly vouchersService: VouchersService,
  ) {}

  /** Bộ điều phối: nhận tên tool + tham số, trả kết quả dạng object cho Gemini. */
  async executeTool(
    name: string,
    args: ToolArgs,
    userId: number | null,
  ): Promise<ToolResult> {
    try {
      switch (name) {
        case 'searchProducts':
          return await this.searchProducts(args);
        case 'getProductDetail':
          return await this.getProductDetail(args);
        case 'getMyDefaultAddress':
          return await this.getMyDefaultAddress(userId);
        case 'validateVoucher':
          return await this.validateVoucher(args);
        case 'proposeOrder':
          return await this.proposeOrder(args, userId);
        default:
          return { error: `Tool không hỗ trợ: ${name}` };
      }
    } catch (error) {
      this.logger.error(`Tool "${name}" thất bại`, error as Error);
      return { error: 'Có lỗi khi thực thi công cụ, vui lòng thử lại.' };
    }
  }

  private async searchProducts(args: ToolArgs): Promise<ToolResult> {
    const query = String(args.query ?? '').trim();
    if (!query) return { products: [] };

    const maxPrice = typeof args.maxPrice === 'number' ? args.maxPrice : null;
    const vector = await this.embedding.embedText(query);
    const results = await this.vectorStore.search(vector, SEARCH_TOP_K);
    const productIds = [...new Set(results.map((r) => r.productId))];
    if (!productIds.length) return { products: [] };

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, status: PRODUCT_STATUS.ACTIVE },
      select: { id: true, name: true, basePrice: true, stock: true, imageUrl: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));

    let list = productIds
      .map((id) => map.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        productId: p.id,
        name: p.name,
        price: decimalToNumberOrZero(p.basePrice),
        stock: p.stock,
        imageUrl: p.imageUrl,
      }));

    if (maxPrice) list = list.filter((p) => p.price <= maxPrice);

    return { products: list.slice(0, SEARCH_MAX_RESULTS) };
  }

  private async getProductDetail(args: ToolArgs): Promise<ToolResult> {
    const productId = Number(args.productId);
    if (!Number.isFinite(productId)) return { error: 'productId không hợp lệ.' };

    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: PRODUCT_STATUS.ACTIVE },
      select: {
        id: true,
        name: true,
        basePrice: true,
        stock: true,
        description: true,
        highlights: true,
        optionGroups: {
          select: {
            id: true,
            name: true,
            required: true,
            options: { select: { id: true, name: true, priceDelta: true } },
          },
        },
      },
    });
    if (!product) return { error: 'Không tìm thấy sản phẩm.' };

    return {
      product: {
        productId: product.id,
        name: product.name,
        price: decimalToNumberOrZero(product.basePrice),
        stock: product.stock,
        description: product.description ?? '',
        highlights: product.highlights ?? [],
        optionGroups: product.optionGroups.map((g) => ({
          id: g.id,
          name: g.name,
          required: g.required,
          options: g.options.map((o) => ({
            id: o.id,
            name: o.name,
            priceDelta: decimalToNumberOrZero(o.priceDelta),
          })),
        })),
      },
    };
  }

  private async getMyDefaultAddress(userId: number | null): Promise<ToolResult> {
    if (!userId) return { error: 'Khách chưa đăng nhập nên chưa có địa chỉ.' };

    const address =
      (await this.prisma.userAddress.findFirst({
        where: { userId, isDefault: true },
      })) ?? (await this.prisma.userAddress.findFirst({ where: { userId } }));

    if (!address) {
      return { error: 'Khách chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trong hồ sơ.' };
    }

    return {
      address: {
        addressId: address.id,
        addressLine: address.addressLine,
        district: address.district,
        city: address.city,
        text: `${address.addressLine}, ${address.district}, ${address.city}`,
      },
    };
  }

  private async validateVoucher(args: ToolArgs): Promise<ToolResult> {
    const code = String(args.code ?? '').trim();
    const subtotal = Number(args.subtotal ?? 0);
    if (!code) return { isValid: false, reason: 'Thiếu mã giảm giá.' };

    const result = await this.vouchersService.validateVoucher({ code, subtotal });
    return {
      isValid: result.isValid,
      reason: result.reason ?? null,
      discountAmount: result.discountAmount,
    };
  }

  /** Tạo bản nháp đơn — KHÔNG ghi DB. Tự tính tiền + lấy địa chỉ mặc định. */
  private async proposeOrder(args: ToolArgs, userId: number | null): Promise<ToolResult> {
    if (!userId) {
      return { error: 'Khách cần đăng nhập để đặt hàng. Hãy mời khách đăng nhập.' };
    }

    const rawItems = Array.isArray(args.items) ? args.items : [];
    if (!rawItems.length) return { error: 'Chưa có sản phẩm nào để đặt.' };

    const warnings: string[] = [];

    // Gom productId + optionId để truy vấn một lần
    const normalized = rawItems
      .map((raw) => {
        const item = raw as ToolArgs;
        const productId = Number(item.productId);
        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
        const optionIds = Array.isArray(item.optionIds)
          ? item.optionIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
          : [];
        return { productId, quantity, optionIds };
      })
      .filter((item) => Number.isFinite(item.productId));

    if (!normalized.length) return { error: 'Danh sách sản phẩm không hợp lệ.' };

    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, status: PRODUCT_STATUS.ACTIVE },
      select: { id: true, name: true, basePrice: true, stock: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const allOptionIds = [...new Set(normalized.flatMap((i) => i.optionIds))];
    const options = allOptionIds.length
      ? await this.prisma.option.findMany({
          where: { id: { in: allOptionIds } },
          select: { id: true, priceDelta: true },
        })
      : [];
    const optionMap = new Map(options.map((o) => [o.id, decimalToNumberOrZero(o.priceDelta)]));

    const draftItems: OrderDraftItem[] = [];
    for (const item of normalized) {
      const product = productMap.get(item.productId);
      if (!product) {
        warnings.push(`Sản phẩm #${item.productId} không còn bán, đã bỏ qua.`);
        continue;
      }
      if (product.stock < item.quantity) {
        warnings.push(`"${product.name}" chỉ còn ${product.stock} sản phẩm.`);
      }
      const optionsTotal = item.optionIds.reduce((sum, id) => sum + (optionMap.get(id) ?? 0), 0);
      const unitPrice = decimalToNumberOrZero(product.basePrice) + optionsTotal;
      draftItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        optionIds: item.optionIds,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      });
    }

    if (!draftItems.length) return { error: 'Không có sản phẩm hợp lệ để đặt.' };

    const subtotal = draftItems.reduce((sum, i) => sum + i.lineTotal, 0);

    // Voucher (nếu có)
    let voucherCode: string | null = null;
    let discountAmount = 0;
    const code = String(args.voucherCode ?? '').trim();
    if (code) {
      const v = await this.vouchersService.validateVoucher({ code, subtotal });
      if (v.isValid) {
        voucherCode = code;
        discountAmount = v.discountAmount;
      } else {
        warnings.push(`Mã "${code}" không dùng được: ${v.reason ?? 'không hợp lệ'}.`);
      }
    }

    // Địa chỉ mặc định
    const addressResult = await this.getMyDefaultAddress(userId);
    const addressData = addressResult.address as
      | { addressId: number; text: string }
      | undefined;
    if (!addressData) {
      warnings.push('Khách chưa có địa chỉ giao hàng mặc định.');
    }

    // Phương thức thanh toán — mặc định VNPay: khách bấm "Đặt đơn" → tạo đơn (chờ
    // thanh toán) → trả link VNPay → thanh toán xong đơn mới chuyển sang "đã thanh toán".
    let paymentMethod = String(args.paymentMethod ?? '').trim().toUpperCase();
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      paymentMethod = PAYMENT_METHOD.VNPAY;
    }

    const shippingFee = 0;
    const finalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

    const orderDraft: OrderDraft = {
      items: draftItems,
      address: addressData
        ? { addressId: addressData.addressId, text: addressData.text }
        : null,
      voucherCode,
      subtotal,
      discountAmount,
      shippingFee,
      finalAmount,
      paymentMethod,
      warnings,
    };

    return { orderDraft };
  }
}
