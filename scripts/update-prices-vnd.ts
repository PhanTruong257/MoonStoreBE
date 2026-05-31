/**
 * Script 1 lần: chuyển toàn bộ giá sản phẩm sang VND.
 * Chạy: npx ts-node --transpile-only scripts/update-prices-vnd.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Giá VND theo category (thực tế thị trường VN)
const CATEGORY_PRICE_MAP: Record<string, [number, number]> = {
  'Flagship Phones':   [15_990_000, 24_990_000],
  'Budget Phones':     [3_990_000,  6_990_000],
  'Foldable Phones':   [28_990_000, 44_990_000],
  'Ultrabooks':        [22_990_000, 32_990_000],
  'Gaming Laptops':    [28_990_000, 44_990_000],
  'Workstations':      [35_990_000, 55_990_000],
  'Fitness Watches':   [2_990_000,  5_490_000],
  'Luxury Watches':    [8_990_000,  14_990_000],
  'DSLR Cameras':      [14_990_000, 22_990_000],
  'Mirrorless Cameras':[18_990_000, 28_990_000],
  'Earbuds':           [1_490_000,  2_990_000],
  'Over-Ear':          [2_990_000,  4_990_000],
  'Controllers':       [990_000,    1_890_000],
  'Keyboards':         [1_490_000,  2_890_000],
  'Hoodies':           [490_000,    890_000],
  'Jackets':           [790_000,    1_490_000],
  'Desks':             [3_990_000,  7_990_000],
  'Chairs':            [2_990_000,  6_990_000],
};

/** Nội suy tuyến tính giá VND theo giá USD trong range của category */
function mapPrice(usdPrice: number, usdMin: number, usdMax: number, vndMin: number, vndMax: number): number {
  const ratio = usdMax === usdMin ? 0.5 : (usdPrice - usdMin) / (usdMax - usdMin);
  const raw = vndMin + ratio * (vndMax - vndMin);
  // Làm tròn đến 10,000đ gần nhất
  return Math.round(raw / 10_000) * 10_000;
}

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      basePrice: true,
      category: { select: { name: true } },
    },
  });

  // Nhóm theo category để tính min/max USD
  const byCategory: Record<string, typeof products> = {};
  for (const p of products) {
    const cat = p.category.name;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  }

  let updated = 0;

  for (const [catName, catProducts] of Object.entries(byCategory)) {
    const range = CATEGORY_PRICE_MAP[catName];
    if (!range) {
      console.warn(`⚠️  Chưa có mapping cho category: "${catName}" — bỏ qua`);
      continue;
    }

    const prices = catProducts.map((p) => Number(p.basePrice));
    const usdMin = Math.min(...prices);
    const usdMax = Math.max(...prices);
    const [vndMin, vndMax] = range;

    for (const product of catProducts) {
      const usd = Number(product.basePrice);
      const vnd = mapPrice(usd, usdMin, usdMax, vndMin, vndMax);

      await prisma.product.update({
        where: { id: product.id },
        data: { basePrice: new Prisma.Decimal(vnd) },
      });

      console.log(
        `[${catName}] ${product.name}: $${usd} → ${vnd.toLocaleString('vi-VN')}đ`,
      );
      updated++;
    }
  }

  console.log(`\n✅ Đã cập nhật ${updated}/${products.length} sản phẩm.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
