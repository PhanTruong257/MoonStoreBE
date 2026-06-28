/**
 * Seed DỮ LIỆU DEMO: đơn hàng lịch sử rải đều ~8 tháng gần đây.
 * Mục đích: cho phần Thống kê admin (biểu đồ + NL2SQL) có dữ liệu để demo.
 *
 * Được gọi bởi prisma/seed-runner.ts — chạy 1 lần (ghi vào seed_logs).
 * ⚠️ Chỉ dùng cho DB DEV/DEMO. KHÔNG chạy trên DB production có dữ liệu khách thật.
 *
 * Tạo: ~12 tài khoản khách mẫu + ~300 đơn (nhiều trạng thái) + ít đổi/trả/hoàn tiền.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const NUM_BUYERS = 12;
const NUM_ORDERS = 300;
const MONTHS_BACK = 8;
const BUYER_PASSWORD = '123456';

// Trạng thái nhóm đơn + tỉ trọng (đa số đã giao để doanh thu có ý nghĩa).
const STATUS_WEIGHTS: Array<{ status: string; weight: number }> = [
  { status: 'DELIVERED', weight: 55 },
  { status: 'SHIPPING', weight: 12 },
  { status: 'CONFIRMED', weight: 12 },
  { status: 'PENDING', weight: 11 },
  { status: 'CANCELLED', weight: 10 },
];
const PAYMENT_METHODS = ['COD', 'VNPAY', 'QR'];
const SHIPPING_FEES = [0, 0, 15000, 30000];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickStatus(): string {
  const total = STATUS_WEIGHTS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of STATUS_WEIGHTS) {
    if (r < x.weight) return x.status;
    r -= x.weight;
  }
  return 'DELIVERED';
}

/** Ngày ngẫu nhiên trong N tháng gần đây, lệch về gần hiện tại (mô phỏng tăng trưởng). */
function randomRecentDate(monthsBack: number): Date {
  const now = Date.now();
  const start = now - monthsBack * 30 * 24 * 60 * 60 * 1000;
  const skew = Math.pow(Math.random(), 0.6); // gần 1 → gần hiện tại hơn
  return new Date(start + skew * (now - start));
}

async function runBatched<T>(items: T[], fn: (item: T) => Promise<unknown>, size = 20): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

type SeedProduct = {
  id: number;
  name: string;
  sellerId: number;
  basePrice: number;
  imageUrl: string;
};

export default async function seedOrders(prisma: PrismaClient): Promise<void> {
  // Guard an toàn: nếu DB đã nhiều đơn thì bỏ qua (tránh nhân đôi nếu seed_logs bị xoá).
  const existingOrders = await prisma.order.count();
  if (existingOrders > 50) {
    console.log(`  (orders) Đã có ${existingOrders} đơn — bỏ qua seed đơn hàng.`);
    return;
  }

  const products = await prisma.product.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, sellerId: true, basePrice: true, imageUrl: true },
  });
  if (products.length === 0) {
    console.log('  (orders) Chưa có sản phẩm nào — hãy seed catalog trước. Bỏ qua.');
    return;
  }
  const productList: SeedProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sellerId: p.sellerId,
    basePrice: Number(p.basePrice),
    imageUrl: p.imageUrl,
  }));

  // 1) Tạo khách mẫu (upsert theo email, createdAt rải trong quá khứ → biểu đồ user growth).
  const passwordHash = bcrypt.hashSync(BUYER_PASSWORD, 10);
  const buyerIds: number[] = [];
  for (let i = 1; i <= NUM_BUYERS; i++) {
    const email = `buyer${i}@moon.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: passwordHash,
        fullName: `Khách Demo ${i}`,
        phone: `09${String(10000000 + i).slice(-8)}`,
        role: 'user',
        status: 'active',
        createdAt: randomRecentDate(MONTHS_BACK),
      },
      select: { id: true },
    });
    buyerIds.push(user.id);
  }
  console.log(`  (orders) Sẵn sàng ${buyerIds.length} khách mẫu.`);

  // 2) Tạo đơn hàng. Mỗi đơn: 1-3 sản phẩm, nhóm theo seller (giống createOrder thật).
  const orderIndexes = Array.from({ length: NUM_ORDERS }, (_, i) => i);
  let created = 0;
  const createdOrders: Array<{ id: number; userId: number; status: string; groupIds: number[]; finalAmount: number; createdAt: Date }> = [];

  await runBatched(orderIndexes, async () => {
    const userId = pick(buyerIds);
    const createdAt = randomRecentDate(MONTHS_BACK);
    const status = pickStatus();
    const paymentMethod = pick(PAYMENT_METHODS);
    const shippingFee = pick(SHIPPING_FEES);

    // chọn 1-3 sản phẩm khác nhau
    const count = randInt(1, 3);
    const chosen: SeedProduct[] = [];
    for (let k = 0; k < count; k++) {
      const p = pick(productList);
      if (!chosen.find((c) => c.id === p.id)) chosen.push(p);
    }

    // gom theo seller
    const bySeller = new Map<number, Array<{ product: SeedProduct; quantity: number }>>();
    for (const product of chosen) {
      const quantity = randInt(1, 3);
      const arr = bySeller.get(product.sellerId) ?? [];
      arr.push({ product, quantity });
      bySeller.set(product.sellerId, arr);
    }

    let totalAmount = 0;
    const groupsData = [...bySeller.entries()].map(([sellerId, items]) => {
      const subtotal = items.reduce((s, it) => s + it.product.basePrice * it.quantity, 0);
      totalAmount += subtotal;
      return {
        sellerId,
        status,
        subtotal: new Prisma.Decimal(subtotal),
        shippingFee: new Prisma.Decimal(0),
        items: {
          create: items.map((it) => ({
            productId: it.product.id,
            productName: it.product.name,
            basePriceAtTime: new Prisma.Decimal(it.product.basePrice),
            optionsTotalAtTime: new Prisma.Decimal(0),
            unitPriceAtTime: new Prisma.Decimal(it.product.basePrice),
            imageUrlAtTime: it.product.imageUrl,
            quantity: it.quantity,
          })),
        },
      };
    });

    const finalAmount = Math.max(0, totalAmount + shippingFee);
    const paymentStatus =
      status === 'DELIVERED' ? 'PAID' : status === 'CANCELLED' ? 'FAILED' : pick(['PENDING', 'PAID']);

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: new Prisma.Decimal(totalAmount),
        shippingFee: new Prisma.Decimal(shippingFee),
        discountAmount: new Prisma.Decimal(0),
        finalAmount: new Prisma.Decimal(finalAmount),
        paymentMethod,
        status,
        paymentStatus,
        shippingAddress: {
          addressLine: `Số ${randInt(1, 200)} Đường Demo`,
          district: pick(['Quận 1', 'Quận 3', 'Cầu Giấy', 'Hai Bà Trưng', 'Hải Châu']),
          city: pick(['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']),
        } as Prisma.InputJsonValue,
        createdAt,
        orderGroups: { create: groupsData },
      },
      select: { id: true, orderGroups: { select: { id: true } } },
    });

    createdOrders.push({
      id: order.id,
      userId,
      status,
      groupIds: order.orderGroups.map((g) => g.id),
      finalAmount,
      createdAt,
    });
    created++;
  });
  console.log(`  (orders) Đã tạo ${created} đơn hàng.`);

  // 3) Một ít yêu cầu đổi/trả (trên đơn đã giao) + hoàn tiền → cho thống kê khiếu nại.
  const delivered = createdOrders.filter((o) => o.status === 'DELIVERED');
  let returns = 0;
  let refunds = 0;
  for (const o of delivered) {
    if (Math.random() < 0.08 && o.groupIds.length) {
      await prisma.returnRequest.create({
        data: {
          orderGroupId: pick(o.groupIds),
          userId: o.userId,
          type: pick(['RETURN', 'EXCHANGE']),
          reason: pick(['Hàng bị lỗi', 'Không đúng mô tả', 'Giao nhầm size/màu', 'Đổi ý']),
          status: pick(['PENDING', 'COMPLETED']),
          createdAt: new Date(o.createdAt.getTime() + randInt(1, 7) * 86400000),
        },
      });
      returns++;
    }
    if (Math.random() < 0.05) {
      await prisma.refundRequest.create({
        data: {
          orderId: o.id,
          userId: o.userId,
          reason: pick(['Hủy đơn sau thanh toán', 'Hàng lỗi xin hoàn tiền']),
          amount: new Prisma.Decimal(Math.round(o.finalAmount * 0.5)),
          status: pick(['PENDING', 'APPROVED', 'REJECTED']),
          createdAt: new Date(o.createdAt.getTime() + randInt(1, 7) * 86400000),
        },
      });
      refunds++;
    }
  }
  console.log(`  (orders) Đã tạo ${returns} yêu cầu đổi/trả, ${refunds} yêu cầu hoàn tiền.`);
}
