import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

import {
  getActiveSellerIdForUser,
  getUserIdFromRequest as extractUserId,
} from '../../common/auth/request-user.helper';
import {
  ORDER_GROUP_STATUS,
  ORDER_GROUP_STATUS_FLOW,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PRODUCT_STATUS,
  REFUND_REQUEST_STATUS,
  RETURN_REQUEST_STATUS,
  RETURN_REQUEST_TYPE,
  SELLER_STATUS,
  SHIPMENT_STATUS,
} from '../../common/constants';
import type { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { PrismaService } from '../../prisma/prisma.service';

const STATUS_PRIORITY = ['DELIVERED', 'SHIPPING', 'CONFIRMED', 'CANCELLED', 'PENDING'];
function deriveEffectiveStatus(groupStatuses: string[]): string {
  if (!groupStatuses.length) return ORDER_GROUP_STATUS.PENDING;
  for (const s of STATUS_PRIORITY) {
    if (groupStatuses.includes(s)) return s;
  }
  return groupStatuses[0];
}
import { PaymentsService } from '../payments/payments.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { WalletService } from '../wallet/wallet.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderGroupStatusDto } from './dto/update-order-group-status.dto';
import type {
  OrderCreateResponseDto,
  OrderDetailResponseDto,
  OrderGroupStatusResponseDto,
  OrderListResponseDto,
} from './dto/orders-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly vouchersService: VouchersService,
    private readonly paymentsService: PaymentsService,
    private readonly walletService: WalletService
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserId(req, this.jwtService);
  }

  private getSellerIdForUser(userId: number) {
    return getActiveSellerIdForUser(this.prisma, userId);
  }

  async createOrder(req: Request, payload: CreateOrderDto): Promise<OrderCreateResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const cart = await this.prisma.cart.findFirst({ where: { userId } });

    if (!cart) {
      throw new BadRequestException('Cart not found.');
    }

    const requestedItemIds = Array.isArray(payload.cartItemIds)
      ? payload.cartItemIds.filter(
          (value): value is number => typeof value === 'number' && Number.isFinite(value)
        )
      : [];

    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
        ...(requestedItemIds.length > 0 ? { id: { in: requestedItemIds } } : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sellerId: true,
            basePrice: true,
            stock: true,
            imageUrl: true,
            status: true,
            seller: { select: { status: true } },
          },
        },
        selectedOptions: {
          include: {
            option: {
              select: {
                id: true,
                name: true,
                priceDelta: true,
                group: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    if (requestedItemIds.length > 0 && cartItems.length !== requestedItemIds.length) {
      throw new BadRequestException('Some selected cart items are no longer available.');
    }

    cartItems.forEach((item) => {
      if (item.product.status !== PRODUCT_STATUS.ACTIVE) {
        throw new BadRequestException(`Product ${item.product.name} is no longer available.`);
      }
      if (item.product.seller.status !== SELLER_STATUS.ACTIVE) {
        throw new BadRequestException(`Product ${item.product.name} is no longer available.`);
      }
      if (item.quantity > item.product.stock) {
        throw new BadRequestException(
          `Product ${item.product.name} is out of stock for requested quantity.`
        );
      }
    });

    const enrichedItems = cartItems.map((item) => {
      const basePrice = Number(item.product.basePrice);
      const optionsTotal = item.selectedOptions.reduce(
        (sum, entry) => sum + Number(entry.option.priceDelta),
        0
      );
      const unitPrice = basePrice + optionsTotal;

      return {
        cartItem: item,
        basePrice,
        optionsTotal,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

    // Never trust a client-supplied shipping fee to be non-negative — a negative
    // value would shrink the amount actually charged.
    const shippingFee = Math.max(0, Number(payload.shippingFee ?? 0));
    const paymentMethod = payload.paymentMethod?.trim().toUpperCase() || PAYMENT_METHOD.COD;
    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    let resolvedShippingAddress: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
    if (payload.addressId) {
      const saved = await this.prisma.userAddress.findUnique({
        where: { id: payload.addressId },
      });
      if (!saved || saved.userId !== userId) {
        throw new BadRequestException('Address not found.');
      }
      resolvedShippingAddress = {
        addressLine: saved.addressLine,
        city: saved.city,
        district: saved.district,
        addressId: saved.id,
      };
    } else if (payload.shippingAddress) {
      resolvedShippingAddress = payload.shippingAddress as Prisma.InputJsonValue;
    }

    let voucherId: number | null = null;
    let discountAmount = 0;
    if (payload.voucherCode?.trim()) {
      const validation = await this.vouchersService.validateVoucher({
        code: payload.voucherCode.trim(),
        subtotal: totalAmount,
      });
      if (!validation.isValid || !validation.voucher) {
        throw new BadRequestException(validation.reason ?? 'Invalid voucher.');
      }
      voucherId = validation.voucher.id;
      discountAmount = validation.discountAmount;
    }

    const finalAmount = Math.max(0, totalAmount + shippingFee - discountAmount);

    const grouped = enrichedItems.reduce(
      (acc, item) => {
        const sellerId = item.cartItem.product.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      },
      {} as Record<number, typeof enrichedItems>
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          voucherId,
          totalAmount: new Prisma.Decimal(totalAmount),
          shippingFee: new Prisma.Decimal(shippingFee),
          discountAmount: new Prisma.Decimal(discountAmount),
          finalAmount: new Prisma.Decimal(finalAmount),
          paymentMethod,
          paymentStatus: PAYMENT_STATUS.PENDING,
          status: ORDER_GROUP_STATUS.PENDING,
          shippingAddress: resolvedShippingAddress,
        },
        select: { id: true },
      });

      for (const [sellerKey, sellerItems] of Object.entries(grouped)) {
        const sellerId = Number(sellerKey);
        const subtotal = sellerItems.reduce((sum, entry) => sum + entry.lineTotal, 0);

        const group = await tx.orderGroup.create({
          data: {
            orderId: createdOrder.id,
            sellerId,
            status: ORDER_GROUP_STATUS.PENDING,
            subtotal: new Prisma.Decimal(subtotal),
            shippingFee: new Prisma.Decimal(0),
          },
          select: { id: true },
        });

        for (const entry of sellerItems) {
          await tx.orderItem.create({
            data: {
              orderGroupId: group.id,
              productId: entry.cartItem.product.id,
              productName: entry.cartItem.product.name,
              basePriceAtTime: new Prisma.Decimal(entry.basePrice),
              optionsTotalAtTime: new Prisma.Decimal(entry.optionsTotal),
              unitPriceAtTime: new Prisma.Decimal(entry.unitPrice),
              imageUrlAtTime: entry.cartItem.product.imageUrl,
              quantity: entry.cartItem.quantity,
              selectedOptions: {
                create: entry.cartItem.selectedOptions.map((selected) => ({
                  optionId: selected.option.id,
                  groupName: selected.option.group.name,
                  optionName: selected.option.name,
                  priceDelta: new Prisma.Decimal(Number(selected.option.priceDelta)),
                })),
              },
            },
          });
        }

        await tx.orderStatusLog.create({
          data: {
            orderGroupId: group.id,
            status: ORDER_GROUP_STATUS.PENDING,
            note: 'Order created',
          },
        });
      }

      // Decrement conditionally inside the transaction so two concurrent orders
      // cannot both pass the earlier check and drive stock negative (oversell).
      for (const entry of enrichedItems) {
        const result = await tx.product.updateMany({
          where: {
            id: entry.cartItem.product.id,
            stock: { gte: entry.cartItem.quantity },
          },
          data: { stock: { decrement: entry.cartItem.quantity } },
        });
        if (result.count === 0) {
          throw new BadRequestException(
            `Product ${entry.cartItem.product.name} is out of stock for requested quantity.`
          );
        }
      }

      if (voucherId !== null) {
        // One voucher per user. Checked inside the transaction so concurrent
        // submissions by the same user cannot both slip a usage through.
        const alreadyUsed = await tx.voucherUsage.findFirst({
          where: { voucherId, userId },
          select: { id: true },
        });
        if (alreadyUsed) {
          throw new BadRequestException('You have already used this voucher.');
        }
        await tx.voucherUsage.create({
          data: {
            voucherId,
            userId,
            orderId: createdOrder.id,
          },
        });
      }

      const orderedCartItemIds = enrichedItems.map((entry) => entry.cartItem.id);
      await tx.cartItemOption.deleteMany({
        where: { cartItemId: { in: orderedCartItemIds } },
      });
      await tx.cartItem.deleteMany({
        where: { id: { in: orderedCartItemIds } },
      });

      return createdOrder;
    });

    let paymentUrl: string | undefined;
    let qrInfo: OrderCreateResponseDto['qrInfo'];
    if (paymentMethod === PAYMENT_METHOD.VNPAY && finalAmount > 0) {
      const ipAddr =
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
        req.ip ||
        '127.0.0.1';
      paymentUrl = await this.paymentsService.createVnpayPayment(order.id, finalAmount, ipAddr);
    } else if (paymentMethod === PAYMENT_METHOD.QR && finalAmount > 0) {
      const qr = await this.paymentsService.createQrPayment(order.id, finalAmount);
      qrInfo = {
        paymentId: qr.paymentId,
        amount: qr.amount,
        bankBin: qr.bankBin,
        bankName: qr.bankName,
        accountNo: qr.accountNo,
        accountName: qr.accountName,
        transferContent: qr.transferContent,
        qrUrl: qr.qrUrl,
      };
    }

    return { orderId: order.id, paymentUrl, qrInfo };
  }

  async findOrders(req: Request): Promise<OrderListResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { orderGroups: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      orders: orders.map((order) => ({
        id: order.id,
        userId: order.userId,
        voucherId: order.voucherId ?? null,
        totalAmount: Number(order.totalAmount),
        shippingFee: Number(order.shippingFee),
        discountAmount: Number(order.discountAmount),
        finalAmount: Number(order.finalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: deriveEffectiveStatus(order.orderGroups.map((g) => g.status)),
        shippingAddress: order.shippingAddress as Record<string, unknown> | null,
        createdAt: order.createdAt.toISOString(),
        groups: order.orderGroups.map((group) => ({
          id: group.id,
          sellerId: group.sellerId,
          status: group.status,
          subtotal: Number(group.subtotal),
          shippingFee: Number(group.shippingFee),
        })),
      })),
    };
  }

  async getOrderDetail(req: Request, orderId: number): Promise<OrderDetailResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderGroups: {
          include: {
            items: {
              include: {
                selectedOptions: true,
              },
            },
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new ForbiddenException('Order not found.');
    }

    return {
      order: {
        id: order.id,
        userId: order.userId,
        voucherId: order.voucherId ?? null,
        totalAmount: Number(order.totalAmount),
        shippingFee: Number(order.shippingFee),
        discountAmount: Number(order.discountAmount),
        finalAmount: Number(order.finalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: deriveEffectiveStatus(order.orderGroups.map((g) => g.status)),
        shippingAddress: order.shippingAddress as Record<string, unknown> | null,
        createdAt: order.createdAt.toISOString(),
        groups: order.orderGroups.map((group) => ({
          id: group.id,
          sellerId: group.sellerId,
          status: group.status,
          subtotal: Number(group.subtotal),
          shippingFee: Number(group.shippingFee),
          items: group.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            basePriceAtTime: Number(item.basePriceAtTime),
            optionsTotalAtTime: Number(item.optionsTotalAtTime),
            unitPriceAtTime: Number(item.unitPriceAtTime),
            imageUrlAtTime: item.imageUrlAtTime,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions.map((opt) => ({
              groupName: opt.groupName,
              optionName: opt.optionName,
              priceDelta: Number(opt.priceDelta),
            })),
          })),
        })),
      },
    };
  }

  async updateGroupStatus(
    req: Request,
    groupId: number,
    payload: UpdateOrderGroupStatusDto
  ): Promise<OrderGroupStatusResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);
    const nextStatus = payload.status?.trim().toUpperCase();

    const isFlowStatus = (ORDER_GROUP_STATUS_FLOW as string[]).includes(nextStatus ?? '');
    if (!nextStatus || (!isFlowStatus && nextStatus !== ORDER_GROUP_STATUS.CANCELLED)) {
      throw new BadRequestException('Invalid status.');
    }

    const group = await this.prisma.orderGroup.findUnique({
      where: { id: groupId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!group || group.sellerId !== sellerId) {
      throw new ForbiddenException('Order group not found.');
    }

    if (
      group.status === ORDER_GROUP_STATUS.CANCELLED ||
      group.status === ORDER_GROUP_STATUS.DELIVERED
    ) {
      throw new BadRequestException('Order group cannot be updated.');
    }

    if (group.status !== ORDER_GROUP_STATUS.PENDING) {
      throw new ForbiddenException(
        'Seller can only act on pending orders. Further status changes are managed by admin.'
      );
    }

    if (nextStatus !== ORDER_GROUP_STATUS.CANCELLED) {
      const flow = ORDER_GROUP_STATUS_FLOW as string[];
      const currentIndex = flow.indexOf(group.status);
      const nextIndex = flow.indexOf(nextStatus);
      if (nextIndex !== currentIndex + 1) {
        throw new BadRequestException('Invalid status transition.');
      }
    }

    const updated = await this.prisma.orderGroup.update({
      where: { id: groupId },
      data: { status: nextStatus },
      select: { id: true, status: true, sellerId: true, subtotal: true },
    });

    await this.prisma.orderStatusLog.create({
      data: {
        orderGroupId: groupId,
        status: nextStatus,
        note: payload.note?.trim() ?? null,
      },
    });

    if (nextStatus === ORDER_GROUP_STATUS.CONFIRMED) {
      await this.prisma.shipment.create({
        data: {
          orderGroupId: groupId,
          carrier: 'MOON_DELIVERY',
          trackingCode: `MOON-${groupId}-${Date.now()}`,
          status: SHIPMENT_STATUS.PENDING,
        },
      });
    }

    if (nextStatus === ORDER_GROUP_STATUS.DELIVERED) {
      const config = await this.prisma.platformConfig.findFirst();
      const commissionRate = config ? Number(config.commissionRate) : 10;
      await this.walletService.creditSellerWallet(
        updated.sellerId,
        updated.id,
        Number(updated.subtotal),
        commissionRate
      );
    }

    return { groupId: updated.id, status: updated.status };
  }

  async createRefundRequest(
    req: Request,
    orderId: number,
    payload: { reason: string; amount: number }
  ) {
    const userId = this.getUserIdFromRequest(req);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, finalAmount: true },
    });

    if (!order || order.userId !== userId) {
      throw new ForbiddenException('Order not found.');
    }

    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero.');
    }
    if (amount > Number(order.finalAmount)) {
      throw new BadRequestException('Refund amount cannot exceed the order total.');
    }

    const existing = await this.prisma.refundRequest.findFirst({
      where: { orderId, userId, status: REFUND_REQUEST_STATUS.PENDING },
    });
    if (existing) {
      throw new BadRequestException('A refund request is already pending for this order.');
    }

    const openReturn = await this.prisma.returnRequest.findFirst({
      where: {
        userId,
        orderGroup: { orderId },
        status: { in: [RETURN_REQUEST_STATUS.PENDING, RETURN_REQUEST_STATUS.APPROVED] },
      },
      select: { id: true },
    });
    if (openReturn) {
      throw new BadRequestException(
        'A return request is already open for this order. Resolve it before requesting a refund.'
      );
    }

    const request = await this.prisma.refundRequest.create({
      data: {
        orderId,
        userId,
        reason: payload.reason,
        amount: new Prisma.Decimal(amount),
        status: REFUND_REQUEST_STATUS.PENDING,
      },
    });

    return { refundRequestId: request.id, status: request.status };
  }

  async createReturnRequest(req: Request, groupId: number, payload: CreateReturnRequestDto) {
    const userId = this.getUserIdFromRequest(req);

    if (!Object.values(RETURN_REQUEST_TYPE).includes(payload.type as never)) {
      throw new BadRequestException('Invalid return type. Must be RETURN or EXCHANGE.');
    }

    const group = await this.prisma.orderGroup.findUnique({
      where: { id: groupId },
      include: { order: { select: { id: true, userId: true } } },
    });

    if (!group || group.order.userId !== userId) {
      throw new NotFoundException('Order group not found.');
    }

    if (group.status !== ORDER_GROUP_STATUS.DELIVERED) {
      throw new BadRequestException('Return request is only allowed for delivered orders.');
    }

    const openRefund = await this.prisma.refundRequest.findFirst({
      where: {
        orderId: group.order.id,
        userId,
        status: { in: [REFUND_REQUEST_STATUS.PENDING, REFUND_REQUEST_STATUS.APPROVED] },
      },
      select: { id: true },
    });
    if (openRefund) {
      throw new BadRequestException(
        'A refund request is already open for this order. Resolve it before requesting a return.'
      );
    }

    const existing = await this.prisma.returnRequest.findFirst({
      where: {
        orderGroupId: groupId,
        userId,
        status: { in: [RETURN_REQUEST_STATUS.PENDING, RETURN_REQUEST_STATUS.APPROVED] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'A return request is already pending or approved for this group.'
      );
    }

    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        orderGroupId: groupId,
        userId,
        type: payload.type,
        reason: payload.reason,
        images: payload.images ? (payload.images as Prisma.InputJsonValue) : Prisma.DbNull,
        status: RETURN_REQUEST_STATUS.PENDING,
      },
    });

    return {
      id: returnRequest.id,
      type: returnRequest.type,
      status: returnRequest.status,
      createdAt: returnRequest.createdAt.toISOString(),
    };
  }

  async getGroupReturnRequests(req: Request, groupId: number) {
    const userId = this.getUserIdFromRequest(req);

    const group = await this.prisma.orderGroup.findUnique({
      where: { id: groupId },
      select: { id: true, order: { select: { userId: true } } },
    });

    if (!group || group.order.userId !== userId) {
      throw new NotFoundException('Order group not found.');
    }

    const requests = await this.prisma.returnRequest.findMany({
      where: { orderGroupId: groupId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      returnRequests: requests.map((r) => ({
        id: r.id,
        type: r.type,
        reason: r.reason,
        images: r.images,
        status: r.status,
        note: r.note,
        processedAt: r.processedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async cancelGroup(req: Request, groupId: number): Promise<OrderGroupStatusResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const group = await this.prisma.orderGroup.findUnique({
      where: { id: groupId },
      include: {
        order: { select: { userId: true } },
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (!group || group.order.userId !== userId) {
      throw new ForbiddenException('Order group not found.');
    }

    if (group.status !== ORDER_GROUP_STATUS.PENDING) {
      throw new BadRequestException('Order group cannot be cancelled.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.orderGroup.update({
        where: { id: groupId },
        data: { status: ORDER_GROUP_STATUS.CANCELLED },
      });

      await tx.orderStatusLog.create({
        data: {
          orderGroupId: groupId,
          status: ORDER_GROUP_STATUS.CANCELLED,
          note: 'Cancelled by buyer',
        },
      });

      await Promise.all(
        group.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
    });

    return { groupId, status: ORDER_GROUP_STATUS.CANCELLED };
  }
}
