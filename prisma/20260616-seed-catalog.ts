/**
 * Seed catalog: seller, brands, categories, products (giá + highlights), option groups/options
 * (gồm price_delta). Dữ liệu lấy từ prisma/seed-data/catalog.json (xuất bằng export-catalog.mjs).
 *
 * Được gọi bởi prisma/seed-runner.ts — không tự chạy, không tự ghi seed_logs (runner lo phần đó).
 * Mọi row upsert theo id -> FK-safe, chạy lại an toàn.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

type CatalogData = {
  owners: Array<{
    id: number;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: string;
    status: string;
  }>;
  sellers: Array<{
    id: number;
    userId: number;
    shopName: string;
    description: string | null;
    rating: number;
    status: string;
    rejectReason: string | null;
  }>;
  brands: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string; parentId: number | null }>;
  products: Array<{
    id: number;
    sellerId: number;
    name: string;
    description: string | null;
    categoryId: number;
    brandId: number;
    basePrice: number;
    stock: number;
    imageUrl: string;
    highlights: Array<{ label: string; value: string }> | null;
    status: string;
  }>;
  optionGroups: Array<{
    id: number;
    productId: number;
    name: string;
    position: number;
    required: boolean;
    multiSelect: boolean;
  }>;
  options: Array<{
    id: number;
    groupId: number;
    name: string;
    priceDelta: number;
    position: number;
  }>;
};

async function runBatched<T>(
  items: T[],
  fn: (item: T) => Promise<unknown>,
  size = 25,
): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

export default async function seed(prisma: PrismaClient): Promise<void> {
  const data: CatalogData = JSON.parse(
    readFileSync(
      join(process.cwd(), 'prisma', 'seed-data', 'catalog.json'),
      'utf8',
    ),
  );

  // 1. Owners (user sở hữu seller) — cần cho product.sellerId FK
  await runBatched(data.owners, (u) =>
    prisma.user.upsert({
      where: { id: u.id },
      create: u,
      update: {
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
        status: u.status,
      },
    }),
  );

  // 2. Sellers
  await runBatched(data.sellers, (s) =>
    prisma.seller.upsert({ where: { id: s.id }, create: s, update: s }),
  );

  // 3. Brands
  await runBatched(data.brands, (b) =>
    prisma.brand.upsert({
      where: { id: b.id },
      create: b,
      update: { name: b.name },
    }),
  );

  // 4. Categories — 2 lượt để parentId tự tham chiếu không trỏ vào row chưa tồn tại
  await runBatched(data.categories, (c) =>
    prisma.category.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name },
      update: { name: c.name },
    }),
  );
  await runBatched(
    data.categories.filter((c) => c.parentId !== null),
    (c) =>
      prisma.category.update({
        where: { id: c.id },
        data: { parentId: c.parentId },
      }),
  );

  // 5. Products
  await runBatched(data.products, (p) => {
    const base = {
      sellerId: p.sellerId,
      name: p.name,
      description: p.description,
      categoryId: p.categoryId,
      brandId: p.brandId,
      basePrice: new Prisma.Decimal(p.basePrice),
      stock: p.stock,
      imageUrl: p.imageUrl,
      highlights: (p.highlights ?? Prisma.DbNull) as
        | Prisma.InputJsonValue
        | typeof Prisma.DbNull,
      status: p.status,
    };
    return prisma.product.upsert({
      where: { id: p.id },
      create: { id: p.id, ...base },
      update: base,
    });
  });

  // 6. Option groups
  await runBatched(data.optionGroups, (g) => {
    const base = {
      productId: g.productId,
      name: g.name,
      position: g.position,
      required: g.required,
      multiSelect: g.multiSelect,
    };
    return prisma.optionGroup.upsert({
      where: { id: g.id },
      create: { id: g.id, ...base },
      update: base,
    });
  });

  // 7. Options (kèm price_delta)
  await runBatched(data.options, (o) => {
    const base = {
      groupId: o.groupId,
      name: o.name,
      priceDelta: new Prisma.Decimal(o.priceDelta),
      position: o.position,
    };
    return prisma.option.upsert({
      where: { id: o.id },
      create: { id: o.id, ...base },
      update: base,
    });
  });

  const [products, options, groups, categories, brands] = await Promise.all([
    prisma.product.count(),
    prisma.option.count(),
    prisma.optionGroup.count(),
    prisma.category.count(),
    prisma.brand.count(),
  ]);
  console.log(
    `    catalog: products=${products} options=${options} optionGroups=${groups} categories=${categories} brands=${brands}`,
  );
}
