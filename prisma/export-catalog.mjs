// Export current catalog (brands, categories, sellers+owners, products, option groups/options)
// from the live DB into prisma/seed-data/catalog.json — the data source for seed-catalog.ts.
import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const num = (d) => (d === null || d === undefined ? null : Number(d));

const sellers = await prisma.seller.findMany();
const ownerIds = [...new Set(sellers.map((s) => s.userId))];
const owners = await prisma.user.findMany({ where: { id: { in: ownerIds } } });

const brands = await prisma.brand.findMany({ orderBy: { id: 'asc' } });
const categories = await prisma.category.findMany({
  select: { id: true, name: true, parentId: true },
  orderBy: { id: 'asc' },
});
const products = await prisma.product.findMany({
  select: {
    id: true, sellerId: true, name: true, description: true,
    categoryId: true, brandId: true, basePrice: true, stock: true,
    imageUrl: true, highlights: true, status: true,
  },
  orderBy: { id: 'asc' },
});
const optionGroups = await prisma.optionGroup.findMany({ orderBy: { id: 'asc' } });
const options = await prisma.option.findMany({ orderBy: { id: 'asc' } });

const data = {
  owners: owners.map((u) => ({
    id: u.id, email: u.email, password: u.password, fullName: u.fullName,
    phone: u.phone, role: u.role, status: u.status,
  })),
  sellers: sellers.map((s) => ({
    id: s.id, userId: s.userId, shopName: s.shopName, description: s.description,
    rating: num(s.rating), status: s.status, rejectReason: s.rejectReason,
  })),
  brands,
  categories,
  products: products.map((p) => ({ ...p, basePrice: num(p.basePrice) })),
  optionGroups,
  options: options.map((o) => ({ ...o, priceDelta: num(o.priceDelta) })),
};

const dir = join(process.cwd(), 'prisma', 'seed-data');
mkdirSync(dir, { recursive: true });
const out = join(dir, 'catalog.json');
writeFileSync(out, JSON.stringify(data));
console.log(
  `Exported -> ${out}\n  owners=${data.owners.length} sellers=${data.sellers.length} ` +
    `brands=${data.brands.length} categories=${data.categories.length} ` +
    `products=${data.products.length} optionGroups=${data.optionGroups.length} options=${data.options.length}`,
);
await prisma.$disconnect();
