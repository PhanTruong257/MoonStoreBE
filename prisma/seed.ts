import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seedAdmin = async () => {
  const email = 'admin@example.com';

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName: 'Admin User',
      phone: '0000000000',
      role: 'admin',
      status: 'active',
    },
  });
};

const seedSeller = async () => {
  const email = 'seller@example.com';

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    const seller = await prisma.seller.findFirst({
      where: { userId: existing.id },
    });
    return { userId: existing.id, sellerId: seller?.id ?? 0 };
  }

  const hashedPassword = await bcrypt.hash('Seller@123', 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName: 'Seller User',
      phone: '0900000001',
      role: 'seller',
      status: 'active',
    },
  });

  const seller = await prisma.seller.create({
    data: {
      userId: user.id,
      shopName: 'Moon Store Shop',
      description: 'Main demo seller',
      status: 'active',
    },
  });

  return { userId: user.id, sellerId: seller.id };
};

const seedBuyer = async () => {
  const email = 'buyer@example.com';

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    return { userId: existing.id };
  }

  const hashedPassword = await bcrypt.hash('Buyer@123', 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName: 'Buyer User',
      phone: '0900000002',
      role: 'buyer',
      status: 'active',
    },
  });

  return { userId: user.id };
};

const seedCatalog = async (sellerId: number) => {
  const categoryTree = [
    {
      name: 'Danh muc',
      children: [
        'Dien thoai',
        'Laptop',
        'May tinh bang',
        'Dong ho thong minh',
        'Tai nghe',
        'Phu kien',
      ],
    },
    {
      name: 'Phones',
      children: ['Flagship Phones', 'Budget Phones', 'Foldable Phones'],
    },
    {
      name: 'Computers',
      children: ['Ultrabooks', 'Gaming Laptops', 'Workstations'],
    },
    {
      name: 'Smart Watch',
      children: ['Fitness Watches', 'Luxury Watches'],
    },
    {
      name: 'Camera',
      children: ['DSLR Cameras', 'Mirrorless Cameras'],
    },
    {
      name: 'Headphones',
      children: ['Earbuds', 'Over-Ear'],
    },
    {
      name: 'Gaming',
      children: ['Controllers', 'Keyboards'],
    },
    {
      name: 'Fashion',
      children: ['Hoodies', 'Jackets'],
    },
    {
      name: 'Furniture',
      children: ['Desks', 'Chairs'],
    },
  ];

  const brandNames = ['Nova', 'PixelPulse', 'Orbit', 'LunaTech'];

  const categories = new Map<string, number>();
  const getOrCreateCategory = async (name: string, parentId?: number) => {
    const existing = await prisma.category.findFirst({
      where: { name, parentId: parentId ?? null },
    });
    return (
      existing ??
      (await prisma.category.create({
        data: { name, parentId: parentId ?? null },
      }))
    );
  };

  for (const parent of categoryTree) {
    const parentCategory = await getOrCreateCategory(parent.name);
    categories.set(parent.name, parentCategory.id);

    for (const childName of parent.children) {
      const childCategory = await getOrCreateCategory(
        childName,
        parentCategory.id,
      );
      categories.set(childName, childCategory.id);
    }
  }

  const brands = new Map<string, number>();
  for (const name of brandNames) {
    const existing = await prisma.brand.findFirst({ where: { name } });
    const brand = existing ?? (await prisma.brand.create({ data: { name } }));
    brands.set(name, brand.id);
  }

  const attributeNames = ['Color', 'Storage', 'RAM'];
  const attributes = new Map<string, number>();
  for (const name of attributeNames) {
    const existing = await prisma.attribute.findFirst({ where: { name } });
    const attribute =
      existing ?? (await prisma.attribute.create({ data: { name } }));
    attributes.set(name, attribute.id);
  }

  const attributeValues = new Map<string, number>();
  const colorValues = ['Midnight', 'Silver', 'Blue', 'Red'];
  const storageValues = ['64GB', '128GB', '256GB'];
  const ramValues = ['4GB', '8GB'];

  for (const value of colorValues) {
    const existing = await prisma.attributeValue.findFirst({
      where: { value, attributeId: attributes.get('Color') },
    });
    const created =
      existing ??
      (await prisma.attributeValue.create({
        data: {
          attributeId: attributes.get('Color') ?? 0,
          value,
        },
      }));
    attributeValues.set(`Color:${value}`, created.id);
  }

  for (const value of storageValues) {
    const existing = await prisma.attributeValue.findFirst({
      where: { value, attributeId: attributes.get('Storage') },
    });
    const created =
      existing ??
      (await prisma.attributeValue.create({
        data: {
          attributeId: attributes.get('Storage') ?? 0,
          value,
        },
      }));
    attributeValues.set(`Storage:${value}`, created.id);
  }

  for (const value of ramValues) {
    const existing = await prisma.attributeValue.findFirst({
      where: { value, attributeId: attributes.get('RAM') },
    });
    const created =
      existing ??
      (await prisma.attributeValue.create({
        data: {
          attributeId: attributes.get('RAM') ?? 0,
          value,
        },
      }));
    attributeValues.set(`RAM:${value}`, created.id);
  }

  const getImageUrl = (slug: string, index: number) =>
    `/images/products/${slug}-${index}.jpg`;
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const subcategoryConfigs = [
    {
      name: 'Flagship Phones',
      models: ['X1', 'X2', 'Ultra'],
      titleSuffix: 'Phone',
      description: 'Flagship OLED smartphone with 5G and pro cameras.',
      basePrice: 699,
      priceStep: 80,
      imageTag: 'flagship-phone',
    },
    {
      name: 'Budget Phones',
      models: ['A1', 'A2', 'Lite'],
      titleSuffix: 'Phone',
      description: 'Affordable smartphone with long battery life.',
      basePrice: 299,
      priceStep: 40,
      imageTag: 'budget-phone',
    },
    {
      name: 'Foldable Phones',
      models: ['Fold X', 'Fold Z', 'Flip Mini'],
      titleSuffix: 'Phone',
      description: 'Foldable display with premium build.',
      basePrice: 999,
      priceStep: 120,
      imageTag: 'foldable-phone',
    },
    {
      name: 'Ultrabooks',
      models: ['Air 13', 'Air 14', 'Slim 15'],
      titleSuffix: 'Ultrabook',
      description: 'Ultralight laptop with all-day battery.',
      basePrice: 1099,
      priceStep: 120,
      imageTag: 'ultrabook',
    },
    {
      name: 'Gaming Laptops',
      models: ['Pro 15', 'Pro 17', 'Max 16'],
      titleSuffix: 'Gaming Laptop',
      description: 'High-performance gaming laptop with RTX graphics.',
      basePrice: 1499,
      priceStep: 150,
      imageTag: 'gaming-laptop',
    },
    {
      name: 'Workstations',
      models: ['Studio 14', 'Studio 16', 'Creator 17'],
      titleSuffix: 'Workstation',
      description: 'Creator workstation with pro-grade performance.',
      basePrice: 1699,
      priceStep: 170,
      imageTag: 'workstation-laptop',
    },
    {
      name: 'Fitness Watches',
      models: ['Active S', 'Active Pro', 'Run X'],
      titleSuffix: 'Watch',
      description: 'Fitness tracking with heart-rate monitoring.',
      basePrice: 179,
      priceStep: 30,
      imageTag: 'fitness-watch',
    },
    {
      name: 'Luxury Watches',
      models: ['Lux One', 'Lux Two', 'Lux Elite'],
      titleSuffix: 'Watch',
      description: 'Premium watch with sapphire glass.',
      basePrice: 299,
      priceStep: 40,
      imageTag: 'luxury-watch',
    },
    {
      name: 'DSLR Cameras',
      models: ['DSLR 24', 'DSLR 28', 'DSLR 32'],
      titleSuffix: 'Camera',
      description: 'DSLR camera with interchangeable lens.',
      basePrice: 649,
      priceStep: 80,
      imageTag: 'dslr-camera',
    },
    {
      name: 'Mirrorless Cameras',
      models: ['Mirror 4K', 'Mirror Pro', 'Mirror Lite'],
      titleSuffix: 'Camera',
      description: 'Compact mirrorless camera with 4K video.',
      basePrice: 749,
      priceStep: 90,
      imageTag: 'mirrorless-camera',
    },
    {
      name: 'Earbuds',
      models: ['Air Buds', 'Air Buds Plus', 'Air Buds Pro'],
      titleSuffix: 'Earbuds',
      description: 'Noise-canceling wireless earbuds.',
      basePrice: 129,
      priceStep: 30,
      imageTag: 'earbuds',
    },
    {
      name: 'Over-Ear',
      models: ['Studio', 'Studio Pro', 'Studio Max'],
      titleSuffix: 'Headset',
      description: 'Over-ear headset with studio tuning.',
      basePrice: 199,
      priceStep: 40,
      imageTag: 'over-ear-headset',
    },
    {
      name: 'Controllers',
      models: ['Gamepad X', 'Gamepad Pro', 'Gamepad Air'],
      titleSuffix: 'Controller',
      description: 'Low-latency controller for PC and console.',
      basePrice: 79,
      priceStep: 20,
      imageTag: 'game-controller',
    },
    {
      name: 'Keyboards',
      models: ['RGB Mech', 'RGB Mech Pro', 'RGB Compact'],
      titleSuffix: 'Keyboard',
      description: 'Mechanical keyboard with hot-swap switches.',
      basePrice: 119,
      priceStep: 25,
      imageTag: 'mechanical-keyboard',
    },
    {
      name: 'Hoodies',
      models: ['Street', 'Street Pro', 'Street Lite'],
      titleSuffix: 'Hoodie',
      description: 'Soft cotton hoodie with relaxed fit.',
      basePrice: 59,
      priceStep: 10,
      imageTag: 'hoodie',
    },
    {
      name: 'Jackets',
      models: ['Denim', 'Denim Pro', 'Denim Lite'],
      titleSuffix: 'Jacket',
      description: 'Classic denim jacket with durable fabric.',
      basePrice: 89,
      priceStep: 15,
      imageTag: 'denim-jacket',
    },
    {
      name: 'Desks',
      models: ['Minimal', 'Minimal Pro', 'Minimal Mini'],
      titleSuffix: 'Desk',
      description: 'Wood desk with clean cable management.',
      basePrice: 249,
      priceStep: 30,
      imageTag: 'wood-desk',
    },
    {
      name: 'Chairs',
      models: ['Lounge', 'Lounge Pro', 'Lounge Lite'],
      titleSuffix: 'Chair',
      description: 'Ergonomic lounge chair with breathable fabric.',
      basePrice: 199,
      priceStep: 25,
      imageTag: 'lounge-chair',
    },
  ];

  const products = subcategoryConfigs.flatMap((config) => {
    return config.models.map((model, index) => {
      const brand =
        brandNames[(index + config.name.length) % brandNames.length];
      const name = `${brand} ${model} ${config.titleSuffix}`.trim();
      const imageBase = slugify(`${brand}-${model}-${config.imageTag}`);
      const skuCodeBase = slugify(`${brand}-${model}-${config.titleSuffix}`)
        .toUpperCase()
        .replace(/-/g, '-');

      return {
        name,
        description: config.description,
        category: config.name,
        brand,
        status: 'active',
        imageBase,
        sku: {
          skuCode: skuCodeBase,
          price: config.basePrice + config.priceStep * index,
          stock: Math.max(10, 60 - index * 10),
          imageUrl: getImageUrl(imageBase, 1),
        },
      };
    });
  });

  for (const product of products) {
    const categoryId = categories.get(product.category);
    const brandId = brands.get(product.brand);
    if (!categoryId || !brandId) {
      continue;
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: product.name,
        sellerId,
      },
    });

    const createdProduct =
      existingProduct ??
      (await prisma.product.create({
        data: {
          sellerId,
          name: product.name,
          description: product.description,
          categoryId,
          brandId,
          status: product.status,
        },
      }));

    const basePrice = product.sku.price;
    const skuVariants = [
      {
        skuCode: `${product.sku.skuCode}-MID-64-4`,
        price: basePrice,
        stock: product.sku.stock,
        imageUrl: getImageUrl(product.imageBase, 1),
        attributes: { Color: 'Midnight', Storage: '64GB', RAM: '4GB' },
      },
      {
        skuCode: `${product.sku.skuCode}-SIL-128-4`,
        price: basePrice + 50,
        stock: Math.max(product.sku.stock - 5, 10),
        imageUrl: getImageUrl(product.imageBase, 2),
        attributes: { Color: 'Silver', Storage: '128GB', RAM: '4GB' },
      },
      {
        skuCode: `${product.sku.skuCode}-BLU-128-8`,
        price: basePrice + 90,
        stock: Math.max(product.sku.stock - 10, 8),
        imageUrl: getImageUrl(product.imageBase, 3),
        attributes: { Color: 'Blue', Storage: '128GB', RAM: '8GB' },
      },
      {
        skuCode: `${product.sku.skuCode}-RED-256-8`,
        price: basePrice + 140,
        stock: Math.max(product.sku.stock - 15, 6),
        imageUrl: getImageUrl(product.imageBase, 1),
        attributes: { Color: 'Red', Storage: '256GB', RAM: '8GB' },
      },
    ];

    for (const variant of skuVariants) {
      const existingSku = await prisma.productSku.findFirst({
        where: { skuCode: variant.skuCode },
      });

      const sku =
        existingSku ??
        (await prisma.productSku.create({
          data: {
            productId: createdProduct.id,
            skuCode: variant.skuCode,
            price: new Prisma.Decimal(variant.price),
            stock: variant.stock,
            imageUrl: variant.imageUrl,
          },
        }));

      const entries = [
        attributeValues.get(`Color:${variant.attributes.Color}`),
        attributeValues.get(`Storage:${variant.attributes.Storage}`),
        attributeValues.get(`RAM:${variant.attributes.RAM}`),
      ].filter((value): value is number => Boolean(value));

      for (const attributeValueId of entries) {
        const existingLink = await prisma.skuAttributeValue.findFirst({
          where: { skuId: sku.id, attributeValueId },
        });
        if (!existingLink) {
          await prisma.skuAttributeValue.create({
            data: { skuId: sku.id, attributeValueId },
          });
        }
      }
    }
  }
};

const seedCart = async (userId: number) => {
  const cart =
    (await prisma.cart.findFirst({ where: { userId } })) ??
    (await prisma.cart.create({ data: { userId } }));

  const skuList = await prisma.productSku.findMany({ take: 3 });

  for (const sku of skuList) {
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, skuId: sku.id },
    });

    if (!existingItem) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          skuId: sku.id,
          quantity: 1,
        },
      });
    }
  }
};

const main = async () => {
  await seedAdmin();
  const { sellerId } = await seedSeller();
  const { userId } = await seedBuyer();

  if (sellerId) {
    await seedCatalog(sellerId);
  }

  await seedCart(userId);
};

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
