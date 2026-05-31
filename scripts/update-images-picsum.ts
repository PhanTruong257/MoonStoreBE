import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ select: { id: true } });

  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { imageUrl: `https://picsum.photos/seed/product-${p.id}/400/400` },
    });
  }

  console.log(`✅ Updated ${products.length} products`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
