import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = '123456';

const upsertUser = async (params: {
  email: string;
  fullName: string;
  phone: string;
  role: string;
}) => {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const existing = await prisma.user.findFirst({
    where: { email: params.email },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashedPassword,
        fullName: params.fullName,
        phone: params.phone,
        role: params.role,
        status: 'active',
      },
    });
  }

  return prisma.user.create({
    data: {
      email: params.email,
      password: hashedPassword,
      fullName: params.fullName,
      phone: params.phone,
      role: params.role,
      status: 'active',
    },
  });
};

const seedAdmin = async () => {
  await upsertUser({
    email: 'admin@example.com',
    fullName: 'Admin User',
    phone: '0000000000',
    role: 'admin',
  });
};

const seedSeller = async () => {
  const user = await upsertUser({
    email: 'seller@example.com',
    fullName: 'Seller User',
    phone: '0900000001',
    role: 'seller',
  });

  const existingSeller = await prisma.seller.findUnique({
    where: { userId: user.id },
  });

  const seller =
    existingSeller ??
    (await prisma.seller.create({
      data: {
        userId: user.id,
        shopName: 'Moon Store Shop',
        description: 'Main demo seller',
        status: 'active',
      },
    }));

  return { userId: user.id, sellerId: seller.id };
};

const seedUser = async () => {
  const user = await upsertUser({
    email: 'user@example.com',
    fullName: 'Normal User',
    phone: '0900000002',
    role: 'user',
  });

  return { userId: user.id };
};

type SeedOptionGroup = {
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: Array<{ name: string; priceDelta: number }>;
};

const buildDefaultOptionGroups = (basePrice: number): SeedOptionGroup[] => [
  {
    name: 'Color',
    required: true,
    multiSelect: false,
    options: [
      { name: 'Midnight', priceDelta: 0 },
      { name: 'Silver', priceDelta: 0 },
      { name: 'Blue', priceDelta: 0 },
      { name: 'Red', priceDelta: 0 },
    ],
  },
  {
    name: 'Storage',
    required: true,
    multiSelect: false,
    options: [
      { name: '64GB', priceDelta: 0 },
      { name: '128GB', priceDelta: Math.round(basePrice * 0.07) },
      { name: '256GB', priceDelta: Math.round(basePrice * 0.15) },
    ],
  },
  {
    name: 'RAM',
    required: true,
    multiSelect: false,
    options: [
      { name: '4GB', priceDelta: 0 },
      { name: '8GB', priceDelta: Math.round(basePrice * 0.1) },
    ],
  },
];

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
    { name: 'Smart Watch', children: ['Fitness Watches', 'Luxury Watches'] },
    { name: 'Camera', children: ['DSLR Cameras', 'Mirrorless Cameras'] },
    { name: 'Headphones', children: ['Earbuds', 'Over-Ear'] },
    { name: 'Gaming', children: ['Controllers', 'Keyboards'] },
    { name: 'Fashion', children: ['Hoodies', 'Jackets'] },
    { name: 'Furniture', children: ['Desks', 'Chairs'] },
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

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  const getImageUrl = (slug: string, index: number) =>
    `/images/products/${slug}-${index}.jpg`;

  const subcategoryConfigs = [
    { name: 'Flagship Phones', models: ['X1', 'X2', 'Ultra'], titleSuffix: 'Phone', description: 'Flagship OLED smartphone with 5G and pro cameras.', basePrice: 699, priceStep: 80, imageTag: 'flagship-phone' },
    { name: 'Budget Phones', models: ['A1', 'A2', 'Lite'], titleSuffix: 'Phone', description: 'Affordable smartphone with long battery life.', basePrice: 299, priceStep: 40, imageTag: 'budget-phone' },
    { name: 'Foldable Phones', models: ['Fold X', 'Fold Z', 'Flip Mini'], titleSuffix: 'Phone', description: 'Foldable display with premium build.', basePrice: 999, priceStep: 120, imageTag: 'foldable-phone' },
    { name: 'Ultrabooks', models: ['Air 13', 'Air 14', 'Slim 15'], titleSuffix: 'Ultrabook', description: 'Ultralight laptop with all-day battery.', basePrice: 1099, priceStep: 120, imageTag: 'ultrabook' },
    { name: 'Gaming Laptops', models: ['Pro 15', 'Pro 17', 'Max 16'], titleSuffix: 'Gaming Laptop', description: 'High-performance gaming laptop with RTX graphics.', basePrice: 1499, priceStep: 150, imageTag: 'gaming-laptop' },
    { name: 'Workstations', models: ['Studio 14', 'Studio 16', 'Creator 17'], titleSuffix: 'Workstation', description: 'Creator workstation with pro-grade performance.', basePrice: 1699, priceStep: 170, imageTag: 'workstation-laptop' },
    { name: 'Fitness Watches', models: ['Active S', 'Active Pro', 'Run X'], titleSuffix: 'Watch', description: 'Fitness tracking with heart-rate monitoring.', basePrice: 179, priceStep: 30, imageTag: 'fitness-watch' },
    { name: 'Luxury Watches', models: ['Lux One', 'Lux Two', 'Lux Elite'], titleSuffix: 'Watch', description: 'Premium watch with sapphire glass.', basePrice: 299, priceStep: 40, imageTag: 'luxury-watch' },
    { name: 'DSLR Cameras', models: ['DSLR 24', 'DSLR 28', 'DSLR 32'], titleSuffix: 'Camera', description: 'DSLR camera with interchangeable lens.', basePrice: 649, priceStep: 80, imageTag: 'dslr-camera' },
    { name: 'Mirrorless Cameras', models: ['Mirror 4K', 'Mirror Pro', 'Mirror Lite'], titleSuffix: 'Camera', description: 'Compact mirrorless camera with 4K video.', basePrice: 749, priceStep: 90, imageTag: 'mirrorless-camera' },
    { name: 'Earbuds', models: ['Air Buds', 'Air Buds Plus', 'Air Buds Pro'], titleSuffix: 'Earbuds', description: 'Noise-canceling wireless earbuds.', basePrice: 129, priceStep: 30, imageTag: 'earbuds' },
    { name: 'Over-Ear', models: ['Studio', 'Studio Pro', 'Studio Max'], titleSuffix: 'Headset', description: 'Over-ear headset with studio tuning.', basePrice: 199, priceStep: 40, imageTag: 'over-ear-headset' },
    { name: 'Controllers', models: ['Gamepad X', 'Gamepad Pro', 'Gamepad Air'], titleSuffix: 'Controller', description: 'Low-latency controller for PC and console.', basePrice: 79, priceStep: 20, imageTag: 'game-controller' },
    { name: 'Keyboards', models: ['RGB Mech', 'RGB Mech Pro', 'RGB Compact'], titleSuffix: 'Keyboard', description: 'Mechanical keyboard with hot-swap switches.', basePrice: 119, priceStep: 25, imageTag: 'mechanical-keyboard' },
    { name: 'Hoodies', models: ['Street', 'Street Pro', 'Street Lite'], titleSuffix: 'Hoodie', description: 'Soft cotton hoodie with relaxed fit.', basePrice: 59, priceStep: 10, imageTag: 'hoodie' },
    { name: 'Jackets', models: ['Denim', 'Denim Pro', 'Denim Lite'], titleSuffix: 'Jacket', description: 'Classic denim jacket with durable fabric.', basePrice: 89, priceStep: 15, imageTag: 'denim-jacket' },
    { name: 'Desks', models: ['Minimal', 'Minimal Pro', 'Minimal Mini'], titleSuffix: 'Desk', description: 'Wood desk with clean cable management.', basePrice: 249, priceStep: 30, imageTag: 'wood-desk' },
    { name: 'Chairs', models: ['Lounge', 'Lounge Pro', 'Lounge Lite'], titleSuffix: 'Chair', description: 'Ergonomic lounge chair with breathable fabric.', basePrice: 199, priceStep: 25, imageTag: 'lounge-chair' },
  ];

  const productSpecs = subcategoryConfigs.flatMap((config) =>
    config.models.map((model, index) => {
      const brand =
        brandNames[(index + config.name.length) % brandNames.length];
      const name = `${brand} ${model} ${config.titleSuffix}`.trim();
      const imageBase = slugify(`${brand}-${model}-${config.imageTag}`);

      return {
        name,
        description: config.description,
        category: config.name,
        brand,
        status: 'active',
        basePrice: config.basePrice + config.priceStep * index,
        stock: Math.max(10, 60 - index * 10),
        imageUrl: getImageUrl(imageBase, 1),
      };
    }),
  );

  for (const spec of productSpecs) {
    const categoryId = categories.get(spec.category);
    const brandId = brands.get(spec.brand);
    if (!categoryId || !brandId) {
      continue;
    }

    const existingProduct = await prisma.product.findFirst({
      where: { name: spec.name, sellerId },
    });

    const product =
      existingProduct ??
      (await prisma.product.create({
        data: {
          sellerId,
          name: spec.name,
          description: spec.description,
          categoryId,
          brandId,
          basePrice: new Prisma.Decimal(spec.basePrice),
          stock: spec.stock,
          imageUrl: spec.imageUrl,
          status: spec.status,
        },
      }));

    if (existingProduct) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          description: spec.description,
          categoryId,
          brandId,
          basePrice: new Prisma.Decimal(spec.basePrice),
          stock: spec.stock,
          imageUrl: spec.imageUrl,
          status: spec.status,
        },
      });
    }

    const existingGroupCount = await prisma.optionGroup.count({
      where: { productId: product.id },
    });
    if (existingGroupCount > 0) {
      continue;
    }

    const groups = buildDefaultOptionGroups(spec.basePrice);
    let groupPosition = 0;
    for (const group of groups) {
      const created = await prisma.optionGroup.create({
        data: {
          productId: product.id,
          name: group.name,
          position: groupPosition,
          required: group.required,
          multiSelect: group.multiSelect,
        },
      });
      groupPosition += 1;

      let optionPosition = 0;
      for (const option of group.options) {
        await prisma.option.create({
          data: {
            groupId: created.id,
            name: option.name,
            priceDelta: new Prisma.Decimal(option.priceDelta),
            position: optionPosition,
          },
        });
        optionPosition += 1;
      }
    }
  }
};

const seedCart = async (userId: number) => {
  const cart =
    (await prisma.cart.findFirst({ where: { userId } })) ??
    (await prisma.cart.create({ data: { userId } }));

  const products = await prisma.product.findMany({
    take: 3,
    include: {
      optionGroups: {
        orderBy: { position: 'asc' },
        include: {
          options: { orderBy: { position: 'asc' } },
        },
      },
    },
  });

  for (const product of products) {
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id },
    });
    if (existingItem) {
      continue;
    }

    const optionIds = product.optionGroups
      .map((group) => group.options[0]?.id)
      .filter((id): id is number => Boolean(id));

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: 1,
        selectedOptions: {
          create: optionIds.map((optionId) => ({ optionId })),
        },
      },
    });
  }
};

const main = async () => {
  await seedAdmin();
  const { sellerId } = await seedSeller();
  const { userId } = await seedUser();

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
