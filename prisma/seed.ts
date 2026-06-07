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
    name: 'Màu sắc',
    required: true,
    multiSelect: false,
    options: [
      { name: 'Đen', priceDelta: 0 },
      { name: 'Trắng', priceDelta: 0 },
      { name: 'Xanh', priceDelta: 0 },
      { name: 'Đỏ', priceDelta: 0 },
    ],
  },
  {
    name: 'Dung lượng',
    required: true,
    multiSelect: false,
    options: [
      { name: '64GB', priceDelta: 0 },
      { name: '128GB', priceDelta: Math.round(basePrice * 0.07) },
      { name: '256GB', priceDelta: Math.round(basePrice * 0.15) },
    ],
  },
];

const seedCatalog = async (sellerId: number) => {
  // Categories from mock-data structure (3 levels)
  const categoryTree = [
    {
      name: 'Phones & Gadgets',
      children: [
        {
          name: 'Phones',
          children: ['Apple iPhone', 'Samsung Galaxy', 'OPPO', 'Xiaomi', 'HONOR', 'Other Brands', 'AI Phones', 'Foldable Phones', '5G', 'Gaming Phone'],
        },
        {
          name: 'Tablets & Readers',
          children: ['iPad', 'Samsung Galaxy Tab', 'Honor Pad', 'E-Readers'],
        },
        {
          name: 'Smart Watches',
          children: ['Apple Watch', 'Samsung Watch', 'Garmin', 'Amazfit'],
        },
      ],
    },
    {
      name: 'Computers & Office',
      children: [
        {
          name: 'Laptops',
          children: ['MacBook', 'Asus', 'Lenovo', 'Dell', 'Acer', 'HP', 'Gaming Laptops', 'AI Laptops', 'Student Laptops', 'Ultrabooks'],
        },
        {
          name: 'Desktops',
          children: ['Office PC', 'Gaming PC', 'Workstation PC'],
        },
        {
          name: 'Monitors',
          children: ['Asus', 'Dell', 'LG', 'MSI', 'Gaming Monitors'],
        },
      ],
    },
    {
      name: 'Home & Appliances',
      children: [
        {
          name: 'Televisions',
          children: ['LED TV', 'OLED TV', 'QLED TV', 'Mini-LED TV', 'Smart TV'],
        },
        {
          name: 'Air Conditioners',
          children: ['Single Cooling', 'Dual Cooling', 'Inverter AC'],
        },
        {
          name: 'Refrigerators',
          children: ['2-Door Fridge', '3-Door Fridge', '4-Door Fridge'],
        },
        {
          name: 'Washing Machines',
          children: ['Front Load', 'Top Load', 'Washer Dryer'],
        },
      ],
    },
    {
      name: 'Accessories & Gaming',
      children: [
        {
          name: 'Headphones',
          children: ['True Wireless', 'Over-Ear', 'Gaming Headset'],
        },
        {
          name: 'Phone Accessories',
          children: ['Cases', 'Screen Protectors', 'Power Banks', 'Fast Chargers', 'Cables'],
        },
        {
          name: 'Laptop Accessories',
          children: ['Mouse', 'Keyboard', 'Backpack', 'Laptop Stand', 'USB Hub'],
        },
        {
          name: 'Gaming Gear',
          children: ['Gaming Keyboard', 'Gaming Mouse', 'Gaming Headset', 'Game Controller'],
        },
      ],
    },
  ];

  // Brands from mock-data
  const brandNames = [
    'Apple',
    'Samsung',
    'OPPO',
    'Xiaomi',
    'HONOR',
    'Asus',
    'Lenovo',
    'Dell',
    'Acer',
    'HP',
    'Sony',
    'LG',
    'Garmin',
    'Amazfit',
    'Logitech',
  ];

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

  // Create category hierarchy (3 levels)
  for (const parent of categoryTree) {
    const parentCategory = await getOrCreateCategory(parent.name);
    categories.set(parent.name, parentCategory.id);

    for (const child of parent.children) {
      const childName = typeof child === 'string' ? child : child.name;
      const childCategory = await getOrCreateCategory(
        childName,
        parentCategory.id,
      );
      categories.set(childName, childCategory.id);

      // Level 3: sub-children
      if (typeof child === 'object' && child.children) {
        for (const subchildName of child.children) {
          const subchildCategory = await getOrCreateCategory(subchildName, childCategory.id);
          categories.set(subchildName, subchildCategory.id);
        }
      }
    }
  }

  // Create brands
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

  const getImageUrl = (slug: string) => `/images/products/${slug}.jpg`;

  // Product specs based on categories
  const productSpecs = [
    // Điện thoại
    {
      category: 'Điện thoại',
      brand: 'Apple',
      name: 'iPhone 15 Pro Max',
      description:
        'Smartphone flagship với màn hình Super Retina XDR, chip A17 Pro',
      basePrice: 28000000,
      stock: 50,
    },
    {
      category: 'Điện thoại',
      brand: 'Samsung',
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Điện thoại cao cấp với camera 200MP, màn hình 6.8 inch',
      basePrice: 25000000,
      stock: 45,
    },
    {
      category: 'Điện thoại',
      brand: 'OPPO',
      name: 'OPPO Reno 11 Pro',
      description: 'Reno series cao cấp với camera night mode tuyệt vời',
      basePrice: 15000000,
      stock: 60,
    },
    {
      category: 'Điện thoại',
      brand: 'Xiaomi',
      name: 'Xiaomi 14 Ultra',
      description: 'Flagship Xiaomi với Leica camera system',
      basePrice: 18000000,
      stock: 55,
    },
    // Máy tính bảng
    {
      category: 'Máy tính bảng',
      brand: 'Apple',
      name: 'iPad Pro 12.9 M3',
      description: 'Máy tính bảng chuyên nghiệp với chip M3',
      basePrice: 20000000,
      stock: 30,
    },
    {
      category: 'Máy tính bảng',
      brand: 'Samsung',
      name: 'Samsung Galaxy Tab S10',
      description: 'Tablet Android cao cấp 14.6 inch',
      basePrice: 18000000,
      stock: 25,
    },
    // Smartwatch
    {
      category: 'Smartwatch',
      brand: 'Apple',
      name: 'Apple Watch Series 9',
      description: 'Smartwatch tích hợp sức khỏe toàn diện',
      basePrice: 8000000,
      stock: 40,
    },
    {
      category: 'Smartwatch',
      brand: 'Garmin',
      name: 'Garmin Epix Pro',
      description: 'Smartwatch thể thao với GPS tuyệt vời',
      basePrice: 12000000,
      stock: 35,
    },
    // Laptop
    {
      category: 'Laptop',
      brand: 'Apple',
      name: 'MacBook Pro 16 M3 Max',
      description: 'Laptop chuyên nghiệp mạnh nhất của Apple',
      basePrice: 45000000,
      stock: 20,
    },
    {
      category: 'Laptop',
      brand: 'Asus',
      name: 'Asus VivoBook 15 OLED',
      description: 'Laptop sinh viên với màn hình OLED',
      basePrice: 12000000,
      stock: 50,
    },
    {
      category: 'Laptop',
      brand: 'Lenovo',
      name: 'Lenovo ThinkBook 14',
      description: 'Laptop văn phòng chuyên nghiệp',
      basePrice: 10000000,
      stock: 55,
    },
    {
      category: 'Laptop',
      brand: 'Dell',
      name: 'Dell XPS 15',
      description: 'Laptop cao cấp cho designer và creator',
      basePrice: 38000000,
      stock: 25,
    },
    // PC - Máy tính để bàn
    {
      category: 'PC - Máy tính để bàn',
      brand: 'Asus',
      name: 'Asus ROG Strix GT16',
      description: 'PC gaming cao cấp',
      basePrice: 50000000,
      stock: 15,
    },
    {
      category: 'PC - Máy tính để bàn',
      brand: 'Dell',
      name: 'Dell XPS Desktop',
      description: 'Máy tính để bàn chuyên nghiệp',
      basePrice: 35000000,
      stock: 20,
    },
    // Màn hình
    {
      category: 'Màn hình',
      brand: 'LG',
      name: 'LG UltraWide 38"',
      description: 'Màn hình ultrawide cho công việc sáng tạo',
      basePrice: 15000000,
      stock: 30,
    },
    {
      category: 'Màn hình',
      brand: 'Dell',
      name: 'Dell S3423DWC',
      description: 'Màn hình cong 34 inch độ phân giải cao',
      basePrice: 12000000,
      stock: 35,
    },
    // TV
    {
      category: 'TV',
      brand: 'LG',
      name: 'LG OLED 55" C4',
      description: 'TV OLED cao cấp với hình ảnh tuyệt vời',
      basePrice: 25000000,
      stock: 25,
    },
    {
      category: 'TV',
      brand: 'Sony',
      name: 'Sony Bravia 65" K-95XR',
      description: 'TV cao cấp nhất của Sony',
      basePrice: 35000000,
      stock: 20,
    },
    {
      category: 'TV',
      brand: 'Samsung',
      name: 'Samsung The Wall Professional',
      description: 'TV micro-LED 89 inch chuyên nghiệp',
      basePrice: 200000000,
      stock: 5,
    },
    // Điều hòa
    {
      category: 'Điều hòa',
      brand: 'Daikin',
      name: 'Daikin Inverter 1.5HP',
      description: 'Điều hòa tiết kiệm điện',
      basePrice: 8000000,
      stock: 40,
    },
    {
      category: 'Điều hòa',
      brand: 'LG',
      name: 'LG Inverter 2HP V24',
      description: 'Điều hòa LG cao cấp với tính năng sạch khuẩn',
      basePrice: 12000000,
      stock: 35,
    },
    // Tủ lạnh
    {
      category: 'Tủ lạnh',
      brand: 'Samsung',
      name: 'Samsung RF60A90R177 Family Hub',
      description: 'Tủ lạnh thông minh 4 cửa',
      basePrice: 25000000,
      stock: 20,
    },
    {
      category: 'Tủ lạnh',
      brand: 'LG',
      name: 'LG GR-X227GSV',
      description: 'Tủ lạnh 595L tiêu chuẩn Châu Âu',
      basePrice: 20000000,
      stock: 25,
    },
    // Máy giặt
    {
      category: 'Máy giặt',
      brand: 'Samsung',
      name: 'Samsung WA21M8700GW',
      description: 'Máy giặt cửa trước 21kg',
      basePrice: 18000000,
      stock: 30,
    },
    {
      category: 'Máy giặt',
      brand: 'LG',
      name: 'LG FV1450S3W',
      description: 'Máy giặt LG AI DD 14.5kg',
      basePrice: 16000000,
      stock: 35,
    },
    // Tai nghe
    {
      category: 'Tai nghe',
      brand: 'Apple',
      name: 'AirPods Pro (2nd Gen)',
      description: 'Tai nghe không dây cao cấp của Apple',
      basePrice: 6000000,
      stock: 60,
    },
    {
      category: 'Tai nghe',
      brand: 'Sony',
      name: 'Sony WH-1000XM5',
      description: 'Tai nghe chùm quá tai khử tiếng ồn tốt nhất',
      basePrice: 9000000,
      stock: 40,
    },
    {
      category: 'Tai nghe',
      brand: 'Logitech',
      name: 'Logitech G Pro X',
      description: 'Tai nghe gaming chuyên nghiệp',
      basePrice: 4000000,
      stock: 50,
    },
    // Phụ kiện điện thoại
    {
      category: 'Phụ kiện điện thoại',
      brand: 'Apple',
      name: 'Apple MagSafe Charger',
      description: 'Sạc nhanh không dây MagSafe',
      basePrice: 1500000,
      stock: 100,
    },
    {
      category: 'Phụ kiện điện thoại',
      brand: 'Samsung',
      name: 'Samsung Galaxy Buds2 Pro',
      description: 'Tai nghe true wireless của Samsung',
      basePrice: 3500000,
      stock: 70,
    },
    // Phụ kiện laptop
    {
      category: 'Phụ kiện laptop',
      brand: 'Logitech',
      name: 'Logitech MX Master 3S',
      description: 'Chuột không dây chuyên nghiệp',
      basePrice: 2500000,
      stock: 80,
    },
    {
      category: 'Phụ kiện laptop',
      brand: 'Asus',
      name: 'Asus ProArt Backpack',
      description: 'Balo laptop cao cấp cho creator',
      basePrice: 2000000,
      stock: 60,
    },
    // Gaming gear
    {
      category: 'Gaming gear',
      brand: 'Logitech',
      name: 'Logitech G502 HERO',
      description: 'Chuột gaming cơ học tiên tiến',
      basePrice: 1800000,
      stock: 90,
    },
    {
      category: 'Gaming gear',
      brand: 'Asus',
      name: 'Asus ROG Ally',
      description: 'Handheld gaming console từ Asus',
      basePrice: 10000000,
      stock: 40,
    },
  ];

  // Create products
  for (const spec of productSpecs) {
    const categoryId = categories.get(spec.category);
    const brandId = brands.get(spec.brand);

    if (!categoryId || !brandId) {
      console.warn(
        `Skipping product ${spec.name}: category or brand not found`,
      );
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
          imageUrl: getImageUrl(slugify(spec.name)),
          status: 'active',
        },
      }));

    if (existingProduct) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          description: spec.description,
          basePrice: new Prisma.Decimal(spec.basePrice),
          stock: spec.stock,
          status: 'active',
        },
      });
    }

    // Create option groups if not exist
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
  console.log('Starting database seed...');
  await seedAdmin();
  console.log('✓ Admin user created');

  const { sellerId } = await seedSeller();
  console.log('✓ Seller user and profile created');

  const { userId } = await seedUser();
  console.log('✓ Normal user created');

  if (sellerId) {
    await seedCatalog(sellerId);
    console.log('✓ Categories and products created');
  }

  await seedCart(userId);
  console.log('✓ Cart items created');

  console.log('✅ Database seeded successfully!');
};

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
