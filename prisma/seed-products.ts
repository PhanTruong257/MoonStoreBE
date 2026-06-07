import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedProducts = async () => {
  const seller = await prisma.seller.findFirst();
  if (!seller) {
    console.error('No seller found');
    return;
  }

  const brands = await prisma.brand.findMany();
  const brandMap = new Map(brands.map((b) => [b.name, b.id]));

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  const productSpecs = [
    // Điện thoại (20)
    {
      category: 'Điện thoại',
      brand: 'Apple',
      name: 'iPhone 15 Pro Max',
      description: 'Flagship Apple với chip A17 Pro',
      basePrice: 28000000,
      stock: 50,
    },
    {
      category: 'Điện thoại',
      brand: 'Apple',
      name: 'iPhone 15 Pro',
      description: 'iPhone Pro tiêu chuẩn',
      basePrice: 25000000,
      stock: 60,
    },
    {
      category: 'Điện thoại',
      brand: 'Apple',
      name: 'iPhone 15',
      description: 'iPhone 15 entry level',
      basePrice: 21000000,
      stock: 70,
    },
    {
      category: 'Điện thoại',
      brand: 'Samsung',
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Flagship Samsung',
      basePrice: 25000000,
      stock: 45,
    },
    {
      category: 'Điện thoại',
      brand: 'Samsung',
      name: 'Samsung Galaxy S24',
      description: 'Galaxy S24 tiêu chuẩn',
      basePrice: 18000000,
      stock: 55,
    },
    {
      category: 'Điện thoại',
      brand: 'Samsung',
      name: 'Samsung Galaxy A54',
      description: 'Galaxy A series',
      basePrice: 10000000,
      stock: 80,
    },
    {
      category: 'Điện thoại',
      brand: 'OPPO',
      name: 'OPPO Reno 11 Pro',
      description: 'OPPO flagship',
      basePrice: 15000000,
      stock: 60,
    },
    {
      category: 'Điện thoại',
      brand: 'OPPO',
      name: 'OPPO Reno 11',
      description: 'OPPO Reno tiêu chuẩn',
      basePrice: 12000000,
      stock: 70,
    },
    {
      category: 'Điện thoại',
      brand: 'Xiaomi',
      name: 'Xiaomi 14 Ultra',
      description: 'Xiaomi flagship',
      basePrice: 18000000,
      stock: 55,
    },
    {
      category: 'Điện thoại',
      brand: 'Xiaomi',
      name: 'Xiaomi 14',
      description: 'Xiaomi 14 tiêu chuẩn',
      basePrice: 14000000,
      stock: 70,
    },
    {
      category: 'Điện thoại',
      brand: 'Xiaomi',
      name: 'Xiaomi 13',
      description: 'Xiaomi 13',
      basePrice: 11000000,
      stock: 75,
    },
    {
      category: 'Điện thoại',
      brand: 'HONOR',
      name: 'HONOR 200 Pro',
      description: 'HONOR flagship',
      basePrice: 12000000,
      stock: 65,
    },
    {
      category: 'Điện thoại',
      brand: 'HONOR',
      name: 'HONOR 200',
      description: 'HONOR 200',
      basePrice: 9000000,
      stock: 80,
    },
    {
      category: 'Điện thoại',
      brand: 'Samsung',
      name: 'Samsung Galaxy Z Fold 5',
      description: 'Foldable flagship',
      basePrice: 35000000,
      stock: 20,
    },
    {
      category: 'Điện thoại',
      brand: 'Samsung',
      name: 'Samsung Galaxy Z Flip 5',
      description: 'Flip phone',
      basePrice: 20000000,
      stock: 35,
    },

    // Máy tính bảng & Máy đọc sách (12)
    {
      category: 'Máy tính bảng & Máy đọc sách',
      brand: 'Apple',
      name: 'iPad Pro 12.9 M3',
      description: 'iPad Pro cao cấp',
      basePrice: 20000000,
      stock: 30,
    },
    {
      category: 'Máy tính bảng & Máy đọc sách',
      brand: 'Apple',
      name: 'iPad Pro 11 M3',
      description: 'iPad Pro 11 inch',
      basePrice: 16000000,
      stock: 35,
    },
    {
      category: 'Máy tính bảng & Máy đọc sách',
      brand: 'Apple',
      name: 'iPad Air M2',
      description: 'iPad Air cao cấp',
      basePrice: 15000000,
      stock: 40,
    },
    {
      category: 'Máy tính bảng & Máy đọc sách',
      brand: 'Apple',
      name: 'iPad 10',
      description: 'iPad entry level',
      basePrice: 9000000,
      stock: 50,
    },
    {
      category: 'Máy tính bảng & Máy đọc sách',
      brand: 'Samsung',
      name: 'Samsung Galaxy Tab S10 Ultra',
      description: 'Tab S10 cao cấp',
      basePrice: 25000000,
      stock: 20,
    },
    {
      category: 'Máy tính bảng & Máy đọc sách',
      brand: 'Samsung',
      name: 'Samsung Galaxy Tab S10',
      description: 'Tab S10 tiêu chuẩn',
      basePrice: 18000000,
      stock: 25,
    },
    {
      category: 'Máy tính bảng & Máy đọc sách',
      brand: 'Samsung',
      name: 'Samsung Galaxy Tab S9',
      description: 'Tab S9',
      basePrice: 12000000,
      stock: 35,
    },
    {
      category: 'Máy tính bảng & Máy đọc sách',
      brand: 'Samsung',
      name: 'Samsung Galaxy Tab A8',
      description: 'Tab A budget',
      basePrice: 6000000,
      stock: 60,
    },

    // Đồng hồ thông minh (10)
    {
      category: 'Đồng hồ thông minh',
      brand: 'Apple',
      name: 'Apple Watch Series 9',
      description: 'Apple Watch cao cấp',
      basePrice: 8000000,
      stock: 40,
    },
    {
      category: 'Đồng hồ thông minh',
      brand: 'Apple',
      name: 'Apple Watch Ultra',
      description: 'Apple Watch dành cho thể thao',
      basePrice: 11000000,
      stock: 30,
    },
    {
      category: 'Đồng hồ thông minh',
      brand: 'Apple',
      name: 'Apple Watch SE',
      description: 'Apple Watch entry level',
      basePrice: 5000000,
      stock: 50,
    },
    {
      category: 'Đồng hồ thông minh',
      brand: 'Samsung',
      name: 'Samsung Galaxy Watch 6',
      description: 'Samsung smartwatch',
      basePrice: 7000000,
      stock: 45,
    },
    {
      category: 'Đồng hồ thông minh',
      brand: 'Samsung',
      name: 'Samsung Galaxy Watch 5',
      description: 'Galaxy Watch 5',
      basePrice: 5500000,
      stock: 50,
    },
    {
      category: 'Đồng hồ thông minh',
      brand: 'Garmin',
      name: 'Garmin Epix Pro',
      description: 'Garmin GPS watch',
      basePrice: 12000000,
      stock: 35,
    },
    {
      category: 'Đồng hồ thông minh',
      brand: 'Garmin',
      name: 'Garmin Fenix 7X',
      description: 'Garmin sports watch',
      basePrice: 9000000,
      stock: 40,
    },
    {
      category: 'Đồng hồ thông minh',
      brand: 'Amazfit',
      name: 'Amazfit GTR 4',
      description: 'Amazfit sports watch',
      basePrice: 5000000,
      stock: 50,
    },
    {
      category: 'Đồng hồ thông minh',
      brand: 'Amazfit',
      name: 'Amazfit GTS 4',
      description: 'Amazfit casual watch',
      basePrice: 4000000,
      stock: 60,
    },

    // Laptop (18)
    {
      category: 'Laptop',
      brand: 'Apple',
      name: 'MacBook Pro 16 M3 Max',
      description: 'MacBook Pro cao cấp',
      basePrice: 45000000,
      stock: 20,
    },
    {
      category: 'Laptop',
      brand: 'Apple',
      name: 'MacBook Pro 14 M3 Max',
      description: 'MacBook Pro 14',
      basePrice: 40000000,
      stock: 25,
    },
    {
      category: 'Laptop',
      brand: 'Apple',
      name: 'MacBook Pro 14 M3',
      description: 'MacBook Pro M3',
      basePrice: 35000000,
      stock: 25,
    },
    {
      category: 'Laptop',
      brand: 'Apple',
      name: 'MacBook Air M2',
      description: 'MacBook Air M2',
      basePrice: 24000000,
      stock: 35,
    },
    {
      category: 'Laptop',
      brand: 'Asus',
      name: 'Asus VivoBook 15 OLED',
      description: 'OLED laptop',
      basePrice: 12000000,
      stock: 50,
    },
    {
      category: 'Laptop',
      brand: 'Asus',
      name: 'Asus VivoBook 14',
      description: 'VivoBook 14',
      basePrice: 10000000,
      stock: 60,
    },
    {
      category: 'Laptop',
      brand: 'Asus',
      name: 'Asus TUF Gaming F15',
      description: 'Gaming laptop',
      basePrice: 18000000,
      stock: 40,
    },
    {
      category: 'Laptop',
      brand: 'Asus',
      name: 'Asus ROG Zephyrus',
      description: 'ROG gaming laptop',
      basePrice: 28000000,
      stock: 20,
    },
    {
      category: 'Laptop',
      brand: 'Lenovo',
      name: 'Lenovo ThinkBook 14',
      description: 'ThinkBook văn phòng',
      basePrice: 10000000,
      stock: 55,
    },
    {
      category: 'Laptop',
      brand: 'Lenovo',
      name: 'Lenovo ThinkPad X1',
      description: 'ThinkPad cao cấp',
      basePrice: 22000000,
      stock: 30,
    },
    {
      category: 'Laptop',
      brand: 'Lenovo',
      name: 'Lenovo Legion 5',
      description: 'Legion gaming',
      basePrice: 16000000,
      stock: 35,
    },
    {
      category: 'Laptop',
      brand: 'Dell',
      name: 'Dell XPS 15',
      description: 'XPS cao cấp',
      basePrice: 38000000,
      stock: 25,
    },
    {
      category: 'Laptop',
      brand: 'Dell',
      name: 'Dell XPS 13',
      description: 'XPS nhỏ gọn',
      basePrice: 28000000,
      stock: 30,
    },
    {
      category: 'Laptop',
      brand: 'Dell',
      name: 'Dell Inspiron 14',
      description: 'Inspiron entry level',
      basePrice: 9000000,
      stock: 70,
    },
    {
      category: 'Laptop',
      brand: 'Dell',
      name: 'Dell G15',
      description: 'Dell gaming',
      basePrice: 20000000,
      stock: 35,
    },
    {
      category: 'Laptop',
      brand: 'HP',
      name: 'HP Pavilion 15',
      description: 'HP tiêu chuẩn',
      basePrice: 9000000,
      stock: 65,
    },
    {
      category: 'Laptop',
      brand: 'HP',
      name: 'HP Envy 13',
      description: 'HP cao cấp',
      basePrice: 18000000,
      stock: 35,
    },
    {
      category: 'Laptop',
      brand: 'HP',
      name: 'HP Omen 15',
      description: 'HP gaming',
      basePrice: 19000000,
      stock: 30,
    },

    // Thêm more products cho các category khác...
    // PC - Máy tính để bàn
    {
      category: 'PC - Máy tính để bàn',
      brand: 'Asus',
      name: 'Asus ROG Strix G16',
      description: 'ROG Gaming PC',
      basePrice: 50000000,
      stock: 15,
    },
    {
      category: 'PC - Máy tính để bàn',
      brand: 'Dell',
      name: 'Dell XPS Tower',
      description: 'XPS Desktop',
      basePrice: 35000000,
      stock: 20,
    },

    // Màn hình
    {
      category: 'Màn hình',
      brand: 'LG',
      name: 'LG UltraWide 38"',
      description: 'LG ultrawide cao cấp',
      basePrice: 15000000,
      stock: 30,
    },
    {
      category: 'Màn hình',
      brand: 'Dell',
      name: 'Dell S3423DWC',
      description: 'Dell curved monitor',
      basePrice: 12000000,
      stock: 35,
    },

    // TV
    {
      category: 'TV',
      brand: 'LG',
      name: 'LG OLED55C4',
      description: 'LG OLED 55 inch',
      basePrice: 25000000,
      stock: 25,
    },
    {
      category: 'TV',
      brand: 'Samsung',
      name: 'Samsung QN95C',
      description: 'Samsung Neo QLED',
      basePrice: 40000000,
      stock: 15,
    },

    // Điều hòa
    {
      category: 'Điều hòa',
      brand: 'LG',
      name: 'LG Inverter 2HP V24',
      description: 'LG cao cấp',
      basePrice: 12000000,
      stock: 35,
    },
    {
      category: 'Điều hòa',
      brand: 'Samsung',
      name: 'Samsung Inverter 2HP',
      description: 'Samsung cao cấp',
      basePrice: 11000000,
      stock: 40,
    },

    // Tủ lạnh
    {
      category: 'Tủ lạnh',
      brand: 'Samsung',
      name: 'Samsung RF60A90R177',
      description: 'Samsung 4 cửa',
      basePrice: 25000000,
      stock: 20,
    },
    {
      category: 'Tủ lạnh',
      brand: 'LG',
      name: 'LG GR-X227GSV',
      description: 'LG 595L',
      basePrice: 20000000,
      stock: 25,
    },

    // Máy giặt
    {
      category: 'Máy giặt',
      brand: 'Samsung',
      name: 'Samsung WA21M8700GW',
      description: 'Samsung 21kg',
      basePrice: 18000000,
      stock: 30,
    },
    {
      category: 'Máy giặt',
      brand: 'LG',
      name: 'LG FV1450S3W',
      description: 'LG 14.5kg',
      basePrice: 16000000,
      stock: 35,
    },

    // Tai nghe
    {
      category: 'Tai nghe',
      brand: 'Apple',
      name: 'AirPods Pro 2',
      description: 'AirPods Pro Gen 2',
      basePrice: 6000000,
      stock: 60,
    },
    {
      category: 'Tai nghe',
      brand: 'Sony',
      name: 'Sony WH-1000XM5',
      description: 'Sony headphone cao cấp',
      basePrice: 9000000,
      stock: 40,
    },

    // Phụ kiện điện thoại
    {
      category: 'Phụ kiện điện thoại',
      brand: 'Apple',
      name: 'Apple MagSafe Charger',
      description: 'Apple sạc từ',
      basePrice: 1500000,
      stock: 100,
    },
    {
      category: 'Phụ kiện điện thoại',
      brand: 'Samsung',
      name: 'Samsung Galaxy Buds2',
      description: 'Samsung tai nghe',
      basePrice: 3500000,
      stock: 70,
    },

    // Phụ kiện laptop
    {
      category: 'Phụ kiện laptop',
      brand: 'Logitech',
      name: 'Logitech MX Master 3S',
      description: 'Chuột cao cấp',
      basePrice: 2500000,
      stock: 80,
    },
    {
      category: 'Phụ kiện laptop',
      brand: 'Asus',
      name: 'Asus ProArt Backpack',
      description: 'Balo chuyên nghiệp',
      basePrice: 2000000,
      stock: 60,
    },

    // Gaming gear
    {
      category: 'Gaming gear',
      brand: 'Logitech',
      name: 'Logitech G502 HERO',
      description: 'Gaming mouse',
      basePrice: 1800000,
      stock: 90,
    },
    {
      category: 'Gaming gear',
      brand: 'Asus',
      name: 'Asus ROG Ally',
      description: 'Gaming handheld',
      basePrice: 10000000,
      stock: 40,
    },
  ];

  let createdCount = 0;
  for (const spec of productSpecs) {
    const categoryId = categoryMap.get(spec.category);
    const brandId = brandMap.get(spec.brand);

    if (!categoryId || !brandId) {
      console.log(
        `Skipping ${spec.name}: category or brand not found`,
      );
      continue;
    }

    const existing = await prisma.product.findFirst({
      where: { name: spec.name, sellerId: seller.id },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          sellerId: seller.id,
          name: spec.name,
          description: spec.description,
          categoryId,
          brandId,
          basePrice: new Prisma.Decimal(spec.basePrice),
          stock: spec.stock,
          imageUrl: `/images/products/${spec.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          status: 'active',
        },
      });
      createdCount++;
    }
  }

  console.log(`✅ ${createdCount} products created!`);
};

seedProducts()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
