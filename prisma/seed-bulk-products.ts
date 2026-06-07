import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedBulkProducts = async () => {
  const seller = await prisma.seller.findFirst();
  if (!seller) {
    console.error('No seller found');
    return;
  }

  const brands = await prisma.brand.findMany();
  const brandMap = new Map(brands.map((b) => [b.name, b.id]));

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  const productData = [
    // ===== ĐIỆN THOẠI (35 products) =====
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone 15 Pro Max 256GB', price: 28000000, stock: 40 },
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone 15 Pro Max 512GB', price: 31000000, stock: 30 },
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone 15 Pro 256GB', price: 25000000, stock: 50 },
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone 15 Pro 512GB', price: 28000000, stock: 40 },
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone 15 128GB', price: 21000000, stock: 60 },
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone 15 256GB', price: 23000000, stock: 50 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy S24 Ultra 256GB', price: 25000000, stock: 35 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy S24 Ultra 512GB', price: 28000000, stock: 25 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy S24 128GB', price: 18000000, stock: 45 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy S24 256GB', price: 20000000, stock: 35 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy A54 128GB', price: 10000000, stock: 70 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy A54 256GB', price: 12000000, stock: 60 },
    { category: 'Điện thoại', brand: 'OPPO', name: 'OPPO Reno 11 Pro 256GB', price: 15000000, stock: 50 },
    { category: 'Điện thoại', brand: 'OPPO', name: 'OPPO Reno 11 Pro 512GB', price: 17000000, stock: 40 },
    { category: 'Điện thoại', brand: 'OPPO', name: 'OPPO Reno 11 256GB', price: 12000000, stock: 60 },
    { category: 'Điện thoại', brand: 'Xiaomi', name: 'Xiaomi 14 Ultra 256GB', price: 18000000, stock: 45 },
    { category: 'Điện thoại', brand: 'Xiaomi', name: 'Xiaomi 14 Ultra 512GB', price: 20000000, stock: 35 },
    { category: 'Điện thoại', brand: 'Xiaomi', name: 'Xiaomi 14 256GB', price: 14000000, stock: 55 },
    { category: 'Điện thoại', brand: 'Xiaomi', name: 'Xiaomi 13 256GB', price: 11000000, stock: 65 },
    { category: 'Điện thoại', brand: 'HONOR', name: 'HONOR 200 Pro 256GB', price: 12000000, stock: 50 },
    { category: 'Điện thoại', brand: 'HONOR', name: 'HONOR 200 256GB', price: 9000000, stock: 70 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy Z Fold 5 256GB', price: 35000000, stock: 15 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy Z Fold 5 512GB', price: 38000000, stock: 10 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy Z Flip 5 256GB', price: 20000000, stock: 25 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy Z Flip 5 512GB', price: 23000000, stock: 20 },
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone SE 128GB', price: 13000000, stock: 50 },
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone SE 256GB', price: 15000000, stock: 40 },
    { category: 'Điện thoại', brand: 'Xiaomi', name: 'Xiaomi 13 Ultra 512GB', price: 19000000, stock: 30 },
    { category: 'Điện thoại', brand: 'OPPO', name: 'OPPO A78 128GB', price: 7000000, stock: 80 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy A34 128GB', price: 8000000, stock: 75 },
    { category: 'Điện thoại', brand: 'Samsung', name: 'Galaxy A34 256GB', price: 10000000, stock: 65 },
    { category: 'Điện thoại', brand: 'HONOR', name: 'HONOR 90 256GB', price: 8000000, stock: 70 },
    { category: 'Điện thoại', brand: 'Xiaomi', name: 'Xiaomi Redmi Note 12 256GB', price: 6000000, stock: 90 },
    { category: 'Điện thoại', brand: 'OPPO', name: 'OPPO A77 128GB', price: 6000000, stock: 85 },
    { category: 'Điện thoại', brand: 'Apple', name: 'iPhone 14 Pro Max 256GB', price: 22000000, stock: 30 },

    // ===== MÁY TÍNH BẢNG (25 products) =====
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad Pro 12.9 M3 256GB', price: 20000000, stock: 25 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad Pro 12.9 M3 512GB', price: 23000000, stock: 20 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad Pro 11 M3 256GB', price: 16000000, stock: 30 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad Pro 11 M3 512GB', price: 19000000, stock: 25 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad Air M2 256GB', price: 15000000, stock: 35 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad Air M2 512GB', price: 18000000, stock: 30 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad 10 64GB', price: 9000000, stock: 45 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad mini M1 256GB', price: 12000000, stock: 35 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab S10 Ultra 256GB', price: 25000000, stock: 15 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab S10 Ultra 512GB', price: 28000000, stock: 12 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab S10 256GB', price: 18000000, stock: 20 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab S10 512GB', price: 21000000, stock: 15 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab S9 256GB', price: 12000000, stock: 30 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab S9 512GB', price: 15000000, stock: 25 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab A8 32GB', price: 6000000, stock: 50 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab A8 64GB', price: 7000000, stock: 45 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Lenovo', name: 'Tab P12 Pro 128GB', price: 14000000, stock: 25 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Lenovo', name: 'Tab P12 Pro 256GB', price: 16000000, stock: 20 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad Pro M2 11 256GB', price: 14000000, stock: 25 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad Pro M2 12.9 256GB', price: 18000000, stock: 20 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab S7 FE 64GB', price: 8000000, stock: 40 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab A7 32GB', price: 5000000, stock: 55 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Lenovo', name: 'Tab P11 64GB', price: 7000000, stock: 40 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Apple', name: 'iPad 9 64GB', price: 7500000, stock: 35 },
    { category: 'Máy tính bảng & Máy đọc sách', brand: 'Samsung', name: 'Galaxy Tab S8 Ultra 128GB', price: 14000000, stock: 20 },

    // ===== SMARTWATCH (18 products) =====
    { category: 'Đồng hồ thông minh', brand: 'Apple', name: 'Apple Watch Series 9 41mm', price: 8000000, stock: 35 },
    { category: 'Đồng hồ thông minh', brand: 'Apple', name: 'Apple Watch Series 9 45mm', price: 8500000, stock: 30 },
    { category: 'Đồng hồ thông minh', brand: 'Apple', name: 'Apple Watch Ultra 49mm', price: 11000000, stock: 25 },
    { category: 'Đồng hồ thông minh', brand: 'Apple', name: 'Apple Watch SE 2023', price: 5000000, stock: 45 },
    { category: 'Đồng hồ thông minh', brand: 'Apple', name: 'Apple Watch Series 8 41mm', price: 6000000, stock: 35 },
    { category: 'Đồng hồ thông minh', brand: 'Samsung', name: 'Galaxy Watch 6 Classic', price: 7500000, stock: 40 },
    { category: 'Đồng hồ thông minh', brand: 'Samsung', name: 'Galaxy Watch 6 40mm', price: 7000000, stock: 45 },
    { category: 'Đồng hồ thông minh', brand: 'Samsung', name: 'Galaxy Watch 5 Pro', price: 6500000, stock: 35 },
    { category: 'Đồng hồ thông minh', brand: 'Samsung', name: 'Galaxy Watch 5 Classic', price: 5500000, stock: 45 },
    { category: 'Đồng hồ thông minh', brand: 'Garmin', name: 'Garmin Epix Gen 2', price: 12000000, stock: 30 },
    { category: 'Đồng hồ thông minh', brand: 'Garmin', name: 'Garmin Fenix 7X', price: 9000000, stock: 35 },
    { category: 'Đồng hồ thông minh', brand: 'Garmin', name: 'Garmin Forerunner 965', price: 8000000, stock: 40 },
    { category: 'Đồng hồ thông minh', brand: 'Amazfit', name: 'Amazfit GTR 4', price: 5000000, stock: 50 },
    { category: 'Đồng hồ thông minh', brand: 'Amazfit', name: 'Amazfit GTS 4', price: 4000000, stock: 60 },
    { category: 'Đồng hồ thông minh', brand: 'Amazfit', name: 'Amazfit T-Rex Ultra', price: 6000000, stock: 40 },
    { category: 'Đồng hồ thông minh', brand: 'Samsung', name: 'Galaxy Watch 4 Classic', price: 4500000, stock: 50 },
    { category: 'Đồng hồ thông minh', brand: 'Apple', name: 'Apple Watch 7 45mm', price: 5000000, stock: 40 },
    { category: 'Đồng hồ thông minh', brand: 'Garmin', name: 'Garmin Venu 2', price: 7000000, stock: 35 },

    // ===== LAPTOP (30 products) =====
    { category: 'Laptop', brand: 'Apple', name: 'MacBook Pro 16 M3 Max 512GB', price: 45000000, stock: 15 },
    { category: 'Laptop', brand: 'Apple', name: 'MacBook Pro 16 M3 Max 1TB', price: 50000000, stock: 12 },
    { category: 'Laptop', brand: 'Apple', name: 'MacBook Pro 14 M3 Max 512GB', price: 40000000, stock: 20 },
    { category: 'Laptop', brand: 'Apple', name: 'MacBook Pro 14 M3 256GB', price: 35000000, stock: 22 },
    { category: 'Laptop', brand: 'Apple', name: 'MacBook Air M2 512GB', price: 24000000, stock: 30 },
    { category: 'Laptop', brand: 'Apple', name: 'MacBook Air M2 256GB', price: 20000000, stock: 35 },
    { category: 'Laptop', brand: 'Apple', name: 'MacBook Air M1 256GB', price: 18000000, stock: 35 },
    { category: 'Laptop', brand: 'Asus', name: 'VivoBook 15 OLED M3500', price: 12000000, stock: 45 },
    { category: 'Laptop', brand: 'Asus', name: 'VivoBook 14 i7', price: 10000000, stock: 55 },
    { category: 'Laptop', brand: 'Asus', name: 'TUF Gaming F15 RTX 4060', price: 18000000, stock: 35 },
    { category: 'Laptop', brand: 'Asus', name: 'ROG Zephyrus G16 RTX 4090', price: 28000000, stock: 18 },
    { category: 'Laptop', brand: 'Asus', name: 'ROG Blade 15 RTX 4070', price: 24000000, stock: 22 },
    { category: 'Laptop', brand: 'Lenovo', name: 'ThinkBook 14 i7', price: 10000000, stock: 50 },
    { category: 'Laptop', brand: 'Lenovo', name: 'ThinkPad X1 Carbon', price: 22000000, stock: 28 },
    { category: 'Laptop', brand: 'Lenovo', name: 'Legion 5 RTX 4060', price: 16000000, stock: 32 },
    { category: 'Laptop', brand: 'Lenovo', name: 'Legion Pro 7i RTX 4090', price: 32000000, stock: 15 },
    { category: 'Laptop', brand: 'Dell', name: 'XPS 15 Intel i7', price: 38000000, stock: 20 },
    { category: 'Laptop', brand: 'Dell', name: 'XPS 13 Plus i7', price: 28000000, stock: 25 },
    { category: 'Laptop', brand: 'Dell', name: 'Inspiron 14 i5', price: 9000000, stock: 65 },
    { category: 'Laptop', brand: 'Dell', name: 'G15 RTX 4060', price: 20000000, stock: 30 },
    { category: 'Laptop', brand: 'HP', name: 'Pavilion 15 i7', price: 9000000, stock: 60 },
    { category: 'Laptop', brand: 'HP', name: 'Envy 13 i7', price: 18000000, stock: 32 },
    { category: 'Laptop', brand: 'HP', name: 'Omen 15 RTX 4060', price: 19000000, stock: 28 },
    { category: 'Laptop', brand: 'Acer', name: 'Aspire 5 i7', price: 8000000, stock: 70 },
    { category: 'Laptop', brand: 'Acer', name: 'Swift 3 i7', price: 11000000, stock: 45 },
    { category: 'Laptop', brand: 'Acer', name: 'Nitro 5 RTX 4050', price: 14000000, stock: 35 },
    { category: 'Laptop', brand: 'Lenovo', name: 'IdeaPad 5 Pro i7', price: 12000000, stock: 40 },
    { category: 'Laptop', brand: 'Dell', name: 'Vostro 15 i5', price: 7500000, stock: 60 },
    { category: 'Laptop', brand: 'HP', name: 'Pavilion 16 RTX 4050', price: 15000000, stock: 35 },
    { category: 'Laptop', brand: 'Asus', name: 'Vivobook Pro 15', price: 14000000, stock: 40 },

    // ===== TV (20 products) =====
    { category: 'TV', brand: 'LG', name: 'OLED55C4', price: 25000000, stock: 20 },
    { category: 'TV', brand: 'LG', name: 'OLED65C4', price: 35000000, stock: 15 },
    { category: 'TV', brand: 'LG', name: 'OLED77C4', price: 45000000, stock: 10 },
    { category: 'TV', brand: 'LG', name: 'QNED99', price: 40000000, stock: 12 },
    { category: 'TV', brand: 'LG', name: 'NanoCell90 55', price: 18000000, stock: 25 },
    { category: 'TV', brand: 'Sony', name: 'K-95XR', price: 35000000, stock: 18 },
    { category: 'TV', brand: 'Sony', name: 'K-75XR', price: 28000000, stock: 22 },
    { category: 'TV', brand: 'Sony', name: 'Bravia XR 55', price: 20000000, stock: 28 },
    { category: 'TV', brand: 'Samsung', name: 'QN95C 85', price: 40000000, stock: 12 },
    { category: 'TV', brand: 'Samsung', name: 'QN95C 75', price: 32000000, stock: 18 },
    { category: 'TV', brand: 'Samsung', name: 'QN90C 65', price: 25000000, stock: 25 },
    { category: 'TV', brand: 'Samsung', name: 'AU7000 55', price: 12000000, stock: 45 },
    { category: 'TV', brand: 'Samsung', name: 'AU8000 65', price: 15000000, stock: 35 },
    { category: 'TV', brand: 'LG', name: 'QNED85 65', price: 28000000, stock: 20 },
    { category: 'TV', brand: 'Sony', name: 'X90L 55', price: 18000000, stock: 30 },
    { category: 'TV', brand: 'Samsung', name: 'QN90D 55', price: 22000000, stock: 25 },
    { category: 'TV', brand: 'LG', name: 'OLED55B4', price: 20000000, stock: 22 },
    { category: 'TV', brand: 'Sony', name: 'K-85XR', price: 48000000, stock: 8 },
    { category: 'TV', brand: 'Samsung', name: 'The Wall', price: 200000000, stock: 3 },
    { category: 'TV', brand: 'LG', name: 'Signature OLED M4', price: 50000000, stock: 5 },

    // ===== ĐIỀU HÒA (15 products) =====
    { category: 'Điều hòa', brand: 'LG', name: 'Inverter 2HP V24', price: 12000000, stock: 30 },
    { category: 'Điều hòa', brand: 'LG', name: 'Inverter 1HP V10', price: 8000000, stock: 45 },
    { category: 'Điều hòa', brand: 'LG', name: 'Inverter 1.5HP V15', price: 10000000, stock: 40 },
    { category: 'Điều hòa', brand: 'Samsung', name: 'Inverter 2HP AR24', price: 11000000, stock: 35 },
    { category: 'Điều hòa', brand: 'Samsung', name: 'Inverter 1.5HP AR18', price: 9000000, stock: 42 },
    { category: 'Điều hòa', brand: 'Samsung', name: 'Inverter 1HP AR12', price: 7000000, stock: 50 },
    { category: 'Điều hòa', brand: 'LG', name: 'Inverter 2.5HP V25', price: 14000000, stock: 25 },
    { category: 'Điều hòa', brand: 'Samsung', name: 'Inverter 2.5HP AR25', price: 13000000, stock: 28 },
    { category: 'Điều hòa', brand: 'LG', name: 'Smart Inverter 1HP', price: 9000000, stock: 40 },
    { category: 'Điều hòa', brand: 'Samsung', name: 'Wind-Free 1.5HP', price: 11000000, stock: 35 },
    { category: 'Điều hòa', brand: 'LG', name: 'Dual Inverter 2HP', price: 13000000, stock: 30 },
    { category: 'Điều hòa', brand: 'Samsung', name: 'Best Inverter 1HP', price: 7500000, stock: 48 },
    { category: 'Điều hòa', brand: 'LG', name: 'Super Cooling 2HP', price: 12500000, stock: 32 },
    { category: 'Điều hòa', brand: 'Samsung', name: 'Premium Inverter 2HP', price: 12000000, stock: 35 },
    { category: 'Điều hòa', brand: 'LG', name: 'Eco Inverter 1HP', price: 7500000, stock: 50 },

    // ===== TỦ LẠNH (15 products) =====
    { category: 'Tủ lạnh', brand: 'Samsung', name: 'RF60A90R177', price: 25000000, stock: 18 },
    { category: 'Tủ lạnh', brand: 'Samsung', name: 'RB30N4000', price: 12000000, stock: 35 },
    { category: 'Tủ lạnh', brand: 'Samsung', name: 'RZ32R744535', price: 18000000, stock: 25 },
    { category: 'Tủ lạnh', brand: 'LG', name: 'GR-X227GSV', price: 20000000, stock: 22 },
    { category: 'Tủ lạnh', brand: 'LG', name: 'GR-B207SQYL', price: 10000000, stock: 40 },
    { category: 'Tủ lạnh', brand: 'LG', name: 'GN-L225BL', price: 8000000, stock: 50 },
    { category: 'Tủ lạnh', brand: 'Samsung', name: 'RF28R7201SR', price: 22000000, stock: 20 },
    { category: 'Tủ lạnh', brand: 'LG', name: 'GR-X228GV', price: 19000000, stock: 24 },
    { category: 'Tủ lạnh', brand: 'Samsung', name: 'RB29FERNDSA', price: 13000000, stock: 32 },
    { category: 'Tủ lạnh', brand: 'LG', name: 'GR-L338SV', price: 11000000, stock: 38 },
    { category: 'Tủ lạnh', brand: 'Samsung', name: 'RF50RS', price: 23000000, stock: 18 },
    { category: 'Tủ lạnh', brand: 'LG', name: 'GN-D332BL', price: 9000000, stock: 45 },
    { category: 'Tủ lạnh', brand: 'Samsung', name: 'RB34T605DSA', price: 15000000, stock: 28 },
    { category: 'Tủ lạnh', brand: 'LG', name: 'GR-P208GSV', price: 12000000, stock: 35 },
    { category: 'Tủ lạnh', brand: 'Samsung', name: 'RB27N4050YL', price: 10500000, stock: 40 },

    // ===== MÁY GIẶT (15 products) =====
    { category: 'Máy giặt', brand: 'Samsung', name: 'WA21M8700GW', price: 18000000, stock: 25 },
    { category: 'Máy giặt', brand: 'Samsung', name: 'WA10T5260', price: 9000000, stock: 45 },
    { category: 'Máy giặt', brand: 'Samsung', name: 'WA15T6260', price: 11000000, stock: 40 },
    { category: 'Máy giặt', brand: 'LG', name: 'FV1450S3W', price: 16000000, stock: 30 },
    { category: 'Máy giặt', brand: 'LG', name: 'FC1409S3W', price: 8000000, stock: 50 },
    { category: 'Máy giặt', brand: 'LG', name: 'FV1209S4W', price: 10000000, stock: 42 },
    { category: 'Máy giặt', brand: 'Samsung', name: 'WA13T5200', price: 10500000, stock: 42 },
    { category: 'Máy giặt', brand: 'LG', name: 'FV1211S5K', price: 11000000, stock: 38 },
    { category: 'Máy giặt', brand: 'Samsung', name: 'WA18M7100EW', price: 12000000, stock: 35 },
    { category: 'Máy giặt', brand: 'LG', name: 'FV1219S3W', price: 13000000, stock: 32 },
    { category: 'Máy giặt', brand: 'Samsung', name: 'WA20T6260', price: 14000000, stock: 28 },
    { category: 'Máy giặt', brand: 'LG', name: 'FV1450S4W', price: 15000000, stock: 25 },
    { category: 'Máy giặt', brand: 'Samsung', name: 'WA19N6780', price: 17000000, stock: 22 },
    { category: 'Máy giặt', brand: 'LG', name: 'FV1619S3K', price: 19000000, stock: 20 },
    { category: 'Máy giặt', brand: 'Samsung', name: 'WF25T8000AW', price: 21000000, stock: 18 },

    // ===== TAI NGHE (20 products) =====
    { category: 'Tai nghe', brand: 'Apple', name: 'AirPods Pro 2 USB-C', price: 6000000, stock: 55 },
    { category: 'Tai nghe', brand: 'Apple', name: 'AirPods Pro 2', price: 5800000, stock: 60 },
    { category: 'Tai nghe', brand: 'Apple', name: 'AirPods Max', price: 15000000, stock: 18 },
    { category: 'Tai nghe', brand: 'Apple', name: 'AirPods 3', price: 4000000, stock: 70 },
    { category: 'Tai nghe', brand: 'Sony', name: 'WH-1000XM5', price: 9000000, stock: 35 },
    { category: 'Tai nghe', brand: 'Sony', name: 'WH-1000XM4', price: 7000000, stock: 45 },
    { category: 'Tai nghe', brand: 'Sony', name: 'WF-1000XM5', price: 5500000, stock: 50 },
    { category: 'Tai nghe', brand: 'Logitech', name: 'G Pro X 2', price: 4500000, stock: 55 },
    { category: 'Tai nghe', brand: 'Logitech', name: 'G PRO X', price: 4000000, stock: 60 },
    { category: 'Tai nghe', brand: 'Logitech', name: 'G733', price: 3500000, stock: 65 },
    { category: 'Tai nghe', brand: 'Samsung', name: 'Galaxy Buds2', price: 3000000, stock: 75 },
    { category: 'Tai nghe', brand: 'Samsung', name: 'Galaxy Buds Pro', price: 3500000, stock: 70 },
    { category: 'Tai nghe', brand: 'Samsung', name: 'Galaxy Buds Live', price: 2500000, stock: 80 },
    { category: 'Tai nghe', brand: 'Sony', name: 'WH-CH720', price: 3500000, stock: 65 },
    { category: 'Tai nghe', brand: 'Sony', name: 'WF-C700N', price: 2500000, stock: 75 },
    { category: 'Tai nghe', brand: 'Logitech', name: 'UE BOOM 3', price: 3000000, stock: 60 },
    { category: 'Tai nghe', brand: 'Sony', name: 'WH-XB700', price: 2000000, stock: 85 },
    { category: 'Tai nghe', brand: 'Samsung', name: 'Galaxy Buds FE', price: 1500000, stock: 90 },
    { category: 'Tai nghe', brand: 'Apple', name: 'Beats Solo 3', price: 5000000, stock: 45 },
    { category: 'Tai nghe', brand: 'Logitech', name: 'G433', price: 2500000, stock: 70 },

    // ===== PHỤ KIỆN ĐIỆN THOẠI (20 products) =====
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'MagSafe Charger', price: 1500000, stock: 100 },
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'MagSafe Wallet', price: 1200000, stock: 80 },
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'iPhone 15 Case', price: 1000000, stock: 150 },
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'Apple USB-C Cable', price: 500000, stock: 200 },
    { category: 'Phụ kiện điện thoại', brand: 'Samsung', name: 'Galaxy Buds2', price: 3500000, stock: 70 },
    { category: 'Phụ kiện điện thoại', brand: 'Samsung', name: 'Galaxy S24 Case', price: 800000, stock: 120 },
    { category: 'Phụ kiện điện thoại', brand: 'Logitech', name: 'USB-C Cable 2m', price: 400000, stock: 300 },
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'Lightning Cable', price: 600000, stock: 150 },
    { category: 'Phụ kiện điện thoại', brand: 'Samsung', name: 'Wireless Charger', price: 1500000, stock: 90 },
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'MagSafe Car Mount', price: 1300000, stock: 75 },
    { category: 'Phụ kiện điện thoại', brand: 'Samsung', name: 'S Pen for Galaxy Tab', price: 2000000, stock: 60 },
    { category: 'Phụ kiện điện thoại', brand: 'Logitech', name: 'Pop Socket', price: 300000, stock: 250 },
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'Tempered Glass Screen', price: 400000, stock: 200 },
    { category: 'Phụ kiện điện thoại', brand: 'Samsung', name: 'Phone Stand', price: 500000, stock: 180 },
    { category: 'Phụ kiện điện thoại', brand: 'Logitech', name: 'Phone Grip Ring', price: 350000, stock: 220 },
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'Fast Charger 25W', price: 1800000, stock: 85 },
    { category: 'Phụ kiện điện thoại', brand: 'Samsung', name: 'Power Bank 20000mAh', price: 1200000, stock: 100 },
    { category: 'Phụ kiện điện thoại', brand: 'Logitech', name: 'Car Phone Mount', price: 600000, stock: 140 },
    { category: 'Phụ kiện điện thoại', brand: 'Apple', name: 'iPhone 15 Screen Protector', price: 350000, stock: 250 },
    { category: 'Phụ kiện điện thoại', brand: 'Samsung', name: 'Galaxy Watch Charger', price: 800000, stock: 110 },

    // ===== PHỤ KIỆN LAPTOP (18 products) =====
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'MX Master 3S', price: 2500000, stock: 75 },
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'MX Keys', price: 2200000, stock: 80 },
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'MX Anywhere 3', price: 2000000, stock: 85 },
    { category: 'Phụ kiện laptop', brand: 'Asus', name: 'ProArt Backpack', price: 2000000, stock: 60 },
    { category: 'Phụ kiện laptop', brand: 'Apple', name: 'MacBook Stand', price: 1500000, stock: 70 },
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'USB Hub', price: 1200000, stock: 120 },
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'Webcam 4K', price: 3500000, stock: 45 },
    { category: 'Phụ kiện laptop', brand: 'Asus', name: 'Laptop Cooling Pad', price: 1500000, stock: 90 },
    { category: 'Phụ kiện laptop', brand: 'Apple', name: 'Magic Mouse', price: 1900000, stock: 55 },
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'G502 Gaming Mouse', price: 1800000, stock: 100 },
    { category: 'Phụ kiện laptop', brand: 'Apple', name: 'Magic Trackpad', price: 2100000, stock: 50 },
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'USB-C Dock', price: 3000000, stock: 55 },
    { category: 'Phụ kiện laptop', brand: 'Asus', name: 'Laptop Bag 15"', price: 800000, stock: 120 },
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'Portable Monitor Cable', price: 600000, stock: 150 },
    { category: 'Phụ kiện laptop', brand: 'Apple', name: 'USB-C Hub', price: 1200000, stock: 110 },
    { category: 'Phụ kiện laptop', brand: 'Asus', name: 'Monitor Stand', price: 1300000, stock: 95 },
    { category: 'Phụ kiện laptop', brand: 'Logitech', name: 'Wireless Keyboard K380', price: 1500000, stock: 85 },
    { category: 'Phụ kiện laptop', brand: 'Apple', name: 'Charging Cable USB-C', price: 700000, stock: 130 },

    // ===== GAMING GEAR (15 products) =====
    { category: 'Gaming gear', brand: 'Logitech', name: 'G502 HERO', price: 1800000, stock: 90 },
    { category: 'Gaming gear', brand: 'Logitech', name: 'G Pro X 2', price: 4500000, stock: 55 },
    { category: 'Gaming gear', brand: 'Logitech', name: 'G733 Headset', price: 3500000, stock: 65 },
    { category: 'Gaming gear', brand: 'Asus', name: 'ROG Ally', price: 10000000, stock: 38 },
    { category: 'Gaming gear', brand: 'Logitech', name: 'G913 Keyboard', price: 3200000, stock: 48 },
    { category: 'Gaming gear', brand: 'Asus', name: 'ROG Keycap', price: 2500000, stock: 65 },
    { category: 'Gaming gear', brand: 'Logitech', name: 'G402 Mouse', price: 1200000, stock: 120 },
    { category: 'Gaming gear', brand: 'Asus', name: 'ROG Mousepad XL', price: 1500000, stock: 95 },
    { category: 'Gaming gear', brand: 'Logitech', name: 'G640 Mousepad', price: 900000, stock: 150 },
    { category: 'Gaming gear', brand: 'Asus', name: 'ROG Headphone Stand', price: 1200000, stock: 85 },
    { category: 'Gaming gear', brand: 'Logitech', name: 'G915 Gaming Keyboard', price: 4000000, stock: 45 },
    { category: 'Gaming gear', brand: 'Asus', name: 'ROG Dock', price: 2800000, stock: 40 },
    { category: 'Gaming gear', brand: 'Logitech', name: 'G PRO X 2 Keyboard', price: 2800000, stock: 55 },
    { category: 'Gaming gear', brand: 'Asus', name: 'ROG Mouse Pad Pro', price: 1800000, stock: 70 },
    { category: 'Gaming gear', brand: 'Logitech', name: 'G502 Wireless', price: 2000000, stock: 80 },

    // ===== MÀN HÌNH (12 products) =====
    { category: 'Màn hình', brand: 'LG', name: 'UltraWide 38"', price: 15000000, stock: 28 },
    { category: 'Màn hình', brand: 'LG', name: '34UP550', price: 12000000, stock: 32 },
    { category: 'Màn hình', brand: 'Dell', name: 'S3423DWC', price: 12000000, stock: 30 },
    { category: 'Màn hình', brand: 'Dell', name: 'UltraSharp 32', price: 18000000, stock: 22 },
    { category: 'Màn hình', brand: 'Asus', name: 'PA247CV', price: 8000000, stock: 25 },
    { category: 'Màn hình', brand: 'LG', name: '27UP550', price: 10000000, stock: 32 },
    { category: 'Màn hình', brand: 'Dell', name: 'S2722DGM', price: 10000000, stock: 35 },
    { category: 'Màn hình', brand: 'Asus', name: 'ROG Swift 360Hz', price: 14000000, stock: 25 },
    { category: 'Màn hình', brand: 'Samsung', name: 'Odyssey G9', price: 16000000, stock: 20 },
    { category: 'Màn hình', brand: 'LG', name: 'Ultragear 144Hz', price: 11000000, stock: 28 },
    { category: 'Màn hình', brand: 'Dell', name: 'Alienware AW3821DW', price: 20000000, stock: 15 },
    { category: 'Màn hình', brand: 'Asus', name: 'ProArt PA278QV', price: 9000000, stock: 30 },

    // ===== PC - MÁY TÍNH ĐỂ BÀN (15 products) =====
    { category: 'PC - Máy tính để bàn', brand: 'Asus', name: 'ROG Strix G16', price: 50000000, stock: 12 },
    { category: 'PC - Máy tính để bàn', brand: 'Dell', name: 'XPS Tower', price: 35000000, stock: 18 },
    { category: 'PC - Máy tính để bàn', brand: 'HP', name: 'Envy Desktop', price: 28000000, stock: 22 },
    { category: 'PC - Máy tính để bàn', brand: 'Lenovo', name: 'ThinkCentre i7', price: 15000000, stock: 35 },
    { category: 'PC - Máy tính để bàn', brand: 'Asus', name: 'ROG Strix GT16', price: 45000000, stock: 15 },
    { category: 'PC - Máy tính để bàn', brand: 'Dell', name: 'AlienWare Aurora', price: 38000000, stock: 14 },
    { category: 'PC - Máy tính để bàn', brand: 'HP', name: 'OMEN 40L', price: 32000000, stock: 20 },
    { category: 'PC - Máy tính để bàn', brand: 'Lenovo', name: 'Legion T7', price: 42000000, stock: 16 },
    { category: 'PC - Máy tính để bàn', brand: 'Asus', name: 'ProArt PA12CDT', price: 55000000, stock: 10 },
    { category: 'PC - Máy tính để bàn', brand: 'Dell', name: 'Precision 7680', price: 48000000, stock: 12 },
    { category: 'PC - Máy tính để bàn', brand: 'HP', name: 'Z Workstation', price: 52000000, stock: 11 },
    { category: 'PC - Máy tính để bàn', brand: 'Lenovo', name: 'ThinkStation', price: 38000000, stock: 18 },
    { category: 'PC - Máy tính để bàn', brand: 'Asus', name: 'ExpertCenter', price: 18000000, stock: 28 },
    { category: 'PC - Máy tính để bàn', brand: 'Dell', name: 'Vostro 3900', price: 12000000, stock: 40 },
    { category: 'PC - Máy tính để bàn', brand: 'HP', name: 'Pavilion Desktop', price: 10000000, stock: 45 },
  ];

  let createdCount = 0;
  for (const spec of productData) {
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
          description: `Premium ${spec.name} - High quality product`,
          categoryId,
          brandId,
          basePrice: new Prisma.Decimal(spec.price),
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

seedBulkProducts()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
