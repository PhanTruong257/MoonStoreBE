-- Seed massive products for all categories
-- Get seller ID
SET @sellerId = (SELECT id FROM sellers LIMIT 1);

-- Get brands
SET @appleId = (SELECT id FROM brands WHERE name = 'Apple' LIMIT 1);
SET @samsungId = (SELECT id FROM brands WHERE name = 'Samsung' LIMIT 1);
SET @oppoId = (SELECT id FROM brands WHERE name = 'OPPO' LIMIT 1);
SET @xiaomiId = (SELECT id FROM brands WHERE name = 'Xiaomi' LIMIT 1);
SET @honorId = (SELECT id FROM brands WHERE name = 'HONOR' LIMIT 1);
SET @asusId = (SELECT id FROM brands WHERE name = 'Asus' LIMIT 1);
SET @lenovoId = (SELECT id FROM brands WHERE name = 'Lenovo' LIMIT 1);
SET @dellId = (SELECT id FROM brands WHERE name = 'Dell' LIMIT 1);
SET @acerId = (SELECT id FROM brands WHERE name = 'Acer' LIMIT 1);
SET @hpId = (SELECT id FROM brands WHERE name = 'HP' LIMIT 1);
SET @sonyId = (SELECT id FROM brands WHERE name = 'Sony' LIMIT 1);
SET @lgId = (SELECT id FROM brands WHERE name = 'LG' LIMIT 1);
SET @garminId = (SELECT id FROM brands WHERE name = 'Garmin' LIMIT 1);
SET @amazfitId = (SELECT id FROM brands WHERE name = 'Amazfit' LIMIT 1);
SET @logitechId = (SELECT id FROM brands WHERE name = 'Logitech' LIMIT 1);

-- Get categories
SET @dienthoaiId = (SELECT id FROM categories WHERE name = 'Điện thoại' LIMIT 1);
SET @tabletId = (SELECT id FROM categories WHERE name = 'Máy tính bảng & Máy đọc sách' LIMIT 1);
SET @smartwatchId = (SELECT id FROM categories WHERE name = 'Đồng hồ thông minh' LIMIT 1);
SET @laptopId = (SELECT id FROM categories WHERE name = 'Laptop' LIMIT 1);
SET @pcId = (SELECT id FROM categories WHERE name = 'PC - Máy tính để bàn' LIMIT 1);
SET @screenId = (SELECT id FROM categories WHERE name = 'Màn hình' LIMIT 1);
SET @tvId = (SELECT id FROM categories WHERE name = 'TV' LIMIT 1);
SET @acId = (SELECT id FROM categories WHERE name = 'Điều hòa' LIMIT 1);
SET @fridgeId = (SELECT id FROM categories WHERE name = 'Tủ lạnh' LIMIT 1);
SET @washerId = (SELECT id FROM categories WHERE name = 'Máy giặt' LIMIT 1);
SET @headphoneId = (SELECT id FROM categories WHERE name = 'Tai nghe' LIMIT 1);
SET @phoneAccessoryId = (SELECT id FROM categories WHERE name = 'Phụ kiện điện thoại' LIMIT 1);
SET @laptopAccessoryId = (SELECT id FROM categories WHERE name = 'Phụ kiện laptop' LIMIT 1);
SET @gamingGearId = (SELECT id FROM categories WHERE name = 'Gaming gear' LIMIT 1);

-- Điện thoại (20 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'iPhone 15 Pro Max', 'Flagship Apple với chip A17 Pro', @dienthoaiId, @appleId, 28000000, 50, '/images/products/iphone-15-pro-max.jpg', 'active'),
(@sellerId, 'iPhone 15 Pro', 'iPhone Pro tiêu chuẩn', @dienthoaiId, @appleId, 25000000, 60, '/images/products/iphone-15-pro.jpg', 'active'),
(@sellerId, 'iPhone 15', 'iPhone 15 entry level', @dienthoaiId, @appleId, 21000000, 70, '/images/products/iphone-15.jpg', 'active'),
(@sellerId, 'Samsung Galaxy S24 Ultra', 'Flagship Samsung', @dienthoaiId, @samsungId, 25000000, 45, '/images/products/galaxy-s24-ultra.jpg', 'active'),
(@sellerId, 'Samsung Galaxy S24', 'Galaxy S24 tiêu chuẩn', @dienthoaiId, @samsungId, 18000000, 55, '/images/products/galaxy-s24.jpg', 'active'),
(@sellerId, 'Samsung Galaxy A54', 'Galaxy A series', @dienthoaiId, @samsungId, 10000000, 80, '/images/products/galaxy-a54.jpg', 'active'),
(@sellerId, 'OPPO Reno 11 Pro', 'OPPO flagship', @dienthoaiId, @oppoId, 15000000, 60, '/images/products/oppo-reno-11-pro.jpg', 'active'),
(@sellerId, 'OPPO Reno 11', 'OPPO Reno tiêu chuẩn', @dienthoaiId, @oppoId, 12000000, 70, '/images/products/oppo-reno-11.jpg', 'active'),
(@sellerId, 'Xiaomi 14 Ultra', 'Xiaomi flagship', @dienthoaiId, @xiaomiId, 18000000, 55, '/images/products/xiaomi-14-ultra.jpg', 'active'),
(@sellerId, 'Xiaomi 14', 'Xiaomi 14 tiêu chuẩn', @dienthoaiId, @xiaomiId, 14000000, 70, '/images/products/xiaomi-14.jpg', 'active'),
(@sellerId, 'Xiaomi 13', 'Xiaomi 13', @dienthoaiId, @xiaomiId, 11000000, 75, '/images/products/xiaomi-13.jpg', 'active'),
(@sellerId, 'HONOR 200 Pro', 'HONOR flagship', @dienthoaiId, @honorId, 12000000, 65, '/images/products/honor-200-pro.jpg', 'active'),
(@sellerId, 'HONOR 200', 'HONOR 200', @dienthoaiId, @honorId, 9000000, 80, '/images/products/honor-200.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Z Fold 5', 'Foldable flagship', @dienthoaiId, @samsungId, 35000000, 20, '/images/products/galaxy-z-fold-5.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Z Flip 5', 'Flip phone', @dienthoaiId, @samsungId, 20000000, 35, '/images/products/galaxy-z-flip-5.jpg', 'active'),
(@sellerId, 'OnePlus 12', 'OnePlus flagship', @dienthoaiId, @xiaomiId, 13000000, 50, '/images/products/oneplus-12.jpg', 'active'),
(@sellerId, 'Pixel 8 Pro', 'Google flagship', @dienthoaiId, @googleId, 22000000, 40, '/images/products/pixel-8-pro.jpg', 'active'),
(@sellerId, 'Pixel 8', 'Pixel 8', @dienthoaiId, @googleId, 17000000, 50, '/images/products/pixel-8.jpg', 'active'),
(@sellerId, 'iPhone SE', 'iPhone budget', @dienthoaiId, @appleId, 13000000, 60, '/images/products/iphone-se.jpg', 'active'),
(@sellerId, 'Realme 12 Pro', 'Budget phone', @dienthoaiId, @oppoId, 8000000, 90, '/images/products/realme-12-pro.jpg', 'active');

-- Máy tính bảng (15 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'iPad Pro 12.9 M3', 'iPad Pro cao cấp', @tabletId, @appleId, 20000000, 30, '/images/products/ipad-pro-12-9.jpg', 'active'),
(@sellerId, 'iPad Pro 11 M3', 'iPad Pro 11 inch', @tabletId, @appleId, 16000000, 35, '/images/products/ipad-pro-11.jpg', 'active'),
(@sellerId, 'iPad Air M2', 'iPad Air cao cấp', @tabletId, @appleId, 15000000, 40, '/images/products/ipad-air-m2.jpg', 'active'),
(@sellerId, 'iPad 10', 'iPad entry level', @tabletId, @appleId, 9000000, 50, '/images/products/ipad-10.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Tab S10 Ultra', 'Tab S10 cao cấp', @tabletId, @samsungId, 25000000, 20, '/images/products/galaxy-tab-s10-ultra.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Tab S10', 'Tab S10 tiêu chuẩn', @tabletId, @samsungId, 18000000, 25, '/images/products/galaxy-tab-s10.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Tab S9', 'Tab S9', @tabletId, @samsungId, 12000000, 35, '/images/products/galaxy-tab-s9.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Tab A8', 'Tab A budget', @tabletId, @samsungId, 6000000, 60, '/images/products/galaxy-tab-a8.jpg', 'active'),
(@sellerId, 'Lenovo Tab P12 Pro', 'Lenovo tablet', @tabletId, @lenovoId, 14000000, 30, '/images/products/lenovo-tab-p12.jpg', 'active'),
(@sellerId, 'Huawei MatePad Pro', 'Huawei tablet', @tabletId, @xiaomiId, 13000000, 25, '/images/products/huawei-matepad-pro.jpg', 'active'),
(@sellerId, 'Microsoft Surface Go 3', 'Convertible tablet', @tabletId, @dellId, 12000000, 20, '/images/products/surface-go-3.jpg', 'active'),
(@sellerId, 'Amazon Fire HD 10', 'Budget tablet', @tabletId, @amazonId, 5000000, 70, '/images/products/fire-hd-10.jpg', 'active'),
(@sellerId, 'iPad mini', 'iPad mini', @tabletId, @appleId, 12000000, 40, '/images/products/ipad-mini.jpg', 'active'),
(@sellerId, 'OnePlus Pad', 'OnePlus tablet', @tabletId, @xiaomiId, 11000000, 30, '/images/products/oneplus-pad.jpg', 'active'),
(@sellerId, 'Realme Pad X', 'Budget tablet', @tabletId, @oppoId, 7000000, 50, '/images/products/realme-pad-x.jpg', 'active');

-- Đồng hồ thông minh (12 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'Apple Watch Series 9', 'Apple Watch cao cấp', @smartwatchId, @appleId, 8000000, 40, '/images/products/apple-watch-9.jpg', 'active'),
(@sellerId, 'Apple Watch Ultra', 'Apple Watch dành cho thể thao', @smartwatchId, @appleId, 11000000, 30, '/images/products/apple-watch-ultra.jpg', 'active'),
(@sellerId, 'Apple Watch SE', 'Apple Watch entry level', @smartwatchId, @appleId, 5000000, 50, '/images/products/apple-watch-se.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Watch 6', 'Samsung smartwatch', @smartwatchId, @samsungId, 7000000, 45, '/images/products/galaxy-watch-6.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Watch 5', 'Galaxy Watch 5', @smartwatchId, @samsungId, 5500000, 50, '/images/products/galaxy-watch-5.jpg', 'active'),
(@sellerId, 'Garmin Epix Pro', 'Garmin GPS watch', @smartwatchId, @garminId, 12000000, 35, '/images/products/garmin-epix-pro.jpg', 'active'),
(@sellerId, 'Garmin Fenix 7X', 'Garmin sports watch', @smartwatchId, @garminId, 9000000, 40, '/images/products/garmin-fenix-7x.jpg', 'active'),
(@sellerId, 'Amazfit GTR 4', 'Amazfit sports watch', @smartwatchId, @amazfitId, 5000000, 50, '/images/products/amazfit-gtr-4.jpg', 'active'),
(@sellerId, 'Amazfit GTS 4', 'Amazfit casual watch', @smartwatchId, @amazfitId, 4000000, 60, '/images/products/amazfit-gts-4.jpg', 'active'),
(@sellerId, 'Fitbit Sense 2', 'Fitbit smartwatch', @smartwatchId, @googleId, 6000000, 45, '/images/products/fitbit-sense-2.jpg', 'active'),
(@sellerId, 'Huawei Watch 4', 'Huawei watch', @smartwatchId, @xiaomiId, 5000000, 50, '/images/products/huawei-watch-4.jpg', 'active'),
(@sellerId, 'OnePlus Watch 2', 'OnePlus watch', @smartwatchId, @xiaomiId, 4500000, 55, '/images/products/oneplus-watch-2.jpg', 'active');

-- Laptop (25 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'MacBook Pro 16 M3 Max', 'MacBook Pro cao cấp', @laptopId, @appleId, 45000000, 20, '/images/products/macbook-pro-16.jpg', 'active'),
(@sellerId, 'MacBook Pro 14 M3 Max', 'MacBook Pro 14', @laptopId, @appleId, 40000000, 25, '/images/products/macbook-pro-14.jpg', 'active'),
(@sellerId, 'MacBook Pro 14 M3', 'MacBook Pro M3', @laptopId, @appleId, 35000000, 25, '/images/products/macbook-pro-14-m3.jpg', 'active'),
(@sellerId, 'MacBook Air M2', 'MacBook Air M2', @laptopId, @appleId, 24000000, 35, '/images/products/macbook-air-m2.jpg', 'active'),
(@sellerId, 'MacBook Air M1', 'MacBook Air M1', @laptopId, @appleId, 18000000, 40, '/images/products/macbook-air-m1.jpg', 'active'),
(@sellerId, 'Asus VivoBook 15 OLED', 'OLED laptop', @laptopId, @asusId, 12000000, 50, '/images/products/asus-vivobook-15.jpg', 'active'),
(@sellerId, 'Asus VivoBook 14', 'VivoBook 14', @laptopId, @asusId, 10000000, 60, '/images/products/asus-vivobook-14.jpg', 'active'),
(@sellerId, 'Asus TUF Gaming F15', 'Gaming laptop', @laptopId, @asusId, 18000000, 40, '/images/products/asus-tuf-gaming.jpg', 'active'),
(@sellerId, 'Asus ROG Zephyrus', 'ROG gaming laptop', @laptopId, @asusId, 28000000, 20, '/images/products/asus-rog-zephyrus.jpg', 'active'),
(@sellerId, 'Lenovo ThinkBook 14', 'ThinkBook văn phòng', @laptopId, @lenovoId, 10000000, 55, '/images/products/lenovo-thinkbook-14.jpg', 'active'),
(@sellerId, 'Lenovo ThinkPad X1', 'ThinkPad cao cấp', @laptopId, @lenovoId, 22000000, 30, '/images/products/lenovo-thinkpad-x1.jpg', 'active'),
(@sellerId, 'Lenovo Legion 5', 'Legion gaming', @laptopId, @lenovoId, 16000000, 35, '/images/products/lenovo-legion-5.jpg', 'active'),
(@sellerId, 'Dell XPS 15', 'XPS cao cấp', @laptopId, @dellId, 38000000, 25, '/images/products/dell-xps-15.jpg', 'active'),
(@sellerId, 'Dell XPS 13', 'XPS nhỏ gọn', @laptopId, @dellId, 28000000, 30, '/images/products/dell-xps-13.jpg', 'active'),
(@sellerId, 'Dell Inspiron 14', 'Inspiron entry level', @laptopId, @dellId, 9000000, 70, '/images/products/dell-inspiron-14.jpg', 'active'),
(@sellerId, 'Dell G15', 'Dell gaming', @laptopId, @dellId, 20000000, 35, '/images/products/dell-g15.jpg', 'active'),
(@sellerId, 'HP Pavilion 15', 'HP tiêu chuẩn', @laptopId, @hpId, 9000000, 65, '/images/products/hp-pavilion-15.jpg', 'active'),
(@sellerId, 'HP Envy 13', 'HP cao cấp', @laptopId, @hpId, 18000000, 35, '/images/products/hp-envy-13.jpg', 'active'),
(@sellerId, 'HP Omen 15', 'HP gaming', @laptopId, @hpId, 19000000, 30, '/images/products/hp-omen-15.jpg', 'active'),
(@sellerId, 'Acer Aspire 5', 'Aspire tiêu chuẩn', @laptopId, @acerId, 8000000, 75, '/images/products/acer-aspire-5.jpg', 'active'),
(@sellerId, 'Acer Swift 3', 'Swift mỏng nhẹ', @laptopId, @acerId, 11000000, 50, '/images/products/acer-swift-3.jpg', 'active'),
(@sellerId, 'Acer Nitro 5', 'Nitro gaming', @laptopId, @acerId, 14000000, 40, '/images/products/acer-nitro-5.jpg', 'active'),
(@sellerId, 'Surface Laptop 5', 'Microsoft laptop', @laptopId, @dellId, 20000000, 25, '/images/products/surface-laptop-5.jpg', 'active'),
(@sellerId, 'Google Pixelbook Go', 'Chromebook', @laptopId, @googleId, 9000000, 40, '/images/products/pixelbook-go.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Book 3', 'Galaxy Book', @laptopId, @samsungId, 15000000, 35, '/images/products/galaxy-book-3.jpg', 'active');

-- TV (15 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'LG OLED55C4', 'LG OLED 55 inch', @tvId, @lgId, 25000000, 25, '/images/products/lg-oled-55.jpg', 'active'),
(@sellerId, 'LG OLED65C4', 'LG OLED 65 inch', @tvId, @lgId, 35000000, 20, '/images/products/lg-oled-65.jpg', 'active'),
(@sellerId, 'LG QNED99', 'LG QNED cao cấp', @tvId, @lgId, 40000000, 15, '/images/products/lg-qned-99.jpg', 'active'),
(@sellerId, 'Sony K-95XR', 'Sony Bravia cao cấp', @tvId, @sonyId, 35000000, 20, '/images/products/sony-k95xr.jpg', 'active'),
(@sellerId, 'Sony K-75XR', 'Sony 75 inch', @tvId, @sonyId, 28000000, 25, '/images/products/sony-k75xr.jpg', 'active'),
(@sellerId, 'Samsung QN95C', 'Samsung Neo QLED', @tvId, @samsungId, 40000000, 15, '/images/products/samsung-qn95c.jpg', 'active'),
(@sellerId, 'Samsung QN85C', 'Samsung 85 inch', @tvId, @samsungId, 35000000, 20, '/images/products/samsung-qn85c.jpg', 'active'),
(@sellerId, 'Samsung AU7000', 'Samsung entry level', @tvId, @samsungId, 12000000, 50, '/images/products/samsung-au7000.jpg', 'active'),
(@sellerId, 'Hisense U8K', 'Hisense cao cấp', @tvId, @lgId, 18000000, 30, '/images/products/hisense-u8k.jpg', 'active'),
(@sellerId, 'TCL C845', 'TCL MiniLED', @tvId, @lgId, 15000000, 35, '/images/products/tcl-c845.jpg', 'active'),
(@sellerId, 'OnePlus TV 75', 'OnePlus 75 inch', @tvId, @xiaomiId, 20000000, 25, '/images/products/oneplus-tv-75.jpg', 'active'),
(@sellerId, 'Xiaomi Mi TV', 'Xiaomi Smart TV', @tvId, @xiaomiId, 9000000, 50, '/images/products/xiaomi-mi-tv.jpg', 'active'),
(@sellerId, 'LG NanoCell90', 'LG NanoCell', @tvId, @lgId, 18000000, 30, '/images/products/lg-nanocell-90.jpg', 'active'),
(@sellerId, 'Panasonic MZ1000', 'Panasonic OLED', @tvId, @sonyId, 22000000, 20, '/images/products/panasonic-mz1000.jpg', 'active'),
(@sellerId, 'Realme SLED65', 'Realme 65 inch', @tvId, @oppoId, 10000000, 45, '/images/products/realme-sled65.jpg', 'active');

-- Tai nghe (12 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'AirPods Pro 2', 'AirPods Pro Gen 2', @headphoneId, @appleId, 6000000, 60, '/images/products/airpods-pro-2.jpg', 'active'),
(@sellerId, 'AirPods Max', 'AirPods headphone', @headphoneId, @appleId, 15000000, 20, '/images/products/airpods-max.jpg', 'active'),
(@sellerId, 'Sony WH-1000XM5', 'Sony headphone cao cấp', @headphoneId, @sonyId, 9000000, 40, '/images/products/sony-wh1000xm5.jpg', 'active'),
(@sellerId, 'Sony WH-CH720', 'Sony headphone entry', @headphoneId, @sonyId, 3500000, 70, '/images/products/sony-ch720.jpg', 'active'),
(@sellerId, 'Logitech G Pro X', 'Gaming headphone', @headphoneId, @logitechId, 4000000, 50, '/images/products/logitech-g-pro-x.jpg', 'active'),
(@sellerId, 'Bose QC45', 'Bose noise cancel', @headphoneId, @sonyId, 8000000, 35, '/images/products/bose-qc45.jpg', 'active'),
(@sellerId, 'Sennheiser Momentum 4', 'Sennheiser cao cấp', @headphoneId, @sonyId, 7000000, 40, '/images/products/sennheiser-momentum-4.jpg', 'active'),
(@sellerId, 'JBL Tune 770', 'JBL headphone', @headphoneId, @samsungId, 4000000, 60, '/images/products/jbl-tune-770.jpg', 'active'),
(@sellerId, 'Beats Studio Pro', 'Beats professional', @headphoneId, @appleId, 7000000, 30, '/images/products/beats-studio-pro.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Buds2', 'Samsung earbuds', @headphoneId, @samsungId, 3000000, 80, '/images/products/galaxy-buds2.jpg', 'active'),
(@sellerId, 'Nothing Ear 2', 'Nothing earbuds', @headphoneId, @oppoId, 2500000, 90, '/images/products/nothing-ear-2.jpg', 'active'),
(@sellerId, 'OnePlus Buds Pro 2', 'OnePlus earbuds', @headphoneId, @xiaomiId, 3500000, 70, '/images/products/oneplus-buds-pro-2.jpg', 'active');

-- Gaming gear (10 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'Logitech G502 HERO', 'Gaming mouse', @gamingGearId, @logitechId, 1800000, 90, '/images/products/logitech-g502.jpg', 'active'),
(@sellerId, 'Logitech G Pro X', 'Pro gaming mouse', @gamingGearId, @logitechId, 2200000, 70, '/images/products/logitech-g-pro-x-mouse.jpg', 'active'),
(@sellerId, 'Asus ROG Ally', 'Gaming handheld', @gamingGearId, @asusId, 10000000, 40, '/images/products/asus-rog-ally.jpg', 'active'),
(@sellerId, 'Steam Deck OLED', 'Valve handheld', @gamingGearId, @sonyId, 6500000, 30, '/images/products/steam-deck-oled.jpg', 'active'),
(@sellerId, 'Steam Deck LCD', 'Steam Deck', @gamingGearId, @sonyId, 4500000, 35, '/images/products/steam-deck-lcd.jpg', 'active'),
(@sellerId, 'Corsair K95', 'Mechanical keyboard', @gamingGearId, @logitechId, 4500000, 40, '/images/products/corsair-k95.jpg', 'active'),
(@sellerId, 'Razer DeathStalker', 'Gaming keyboard', @gamingGearId, @logitechId, 3500000, 50, '/images/products/razer-deathstalker.jpg', 'active'),
(@sellerId, 'SteelSeries Apex Pro', 'Pro keyboard', @gamingGearId, @logitechId, 4000000, 45, '/images/products/steelseries-apex-pro.jpg', 'active'),
(@sellerId, 'Asus ROG Strix 2', 'Gaming monitor', @gamingGearId, @asusId, 15000000, 25, '/images/products/asus-rog-strix-2.jpg', 'active'),
(@sellerId, 'MSI Oculux 240Hz', 'Esports monitor', @gamingGearId, @sonyId, 12000000, 30, '/images/products/msi-oculux.jpg', 'active');

-- PC Văn phòng (15 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'Asus ROG Strix G16', 'ROG Gaming PC', @pcId, @asusId, 50000000, 15, '/images/products/asus-rog-strix-g16.jpg', 'active'),
(@sellerId, 'Dell XPS Tower', 'XPS Desktop', @pcId, @dellId, 35000000, 20, '/images/products/dell-xps-tower.jpg', 'active'),
(@sellerId, 'HP Envy Desktop', 'HP Desktop', @pcId, @hpId, 28000000, 25, '/images/products/hp-envy-desktop.jpg', 'active'),
(@sellerId, 'Lenovo ThinkCentre', 'ThinkCentre văn phòng', @pcId, @lenovoId, 15000000, 40, '/images/products/lenovo-thinkcentre.jpg', 'active'),
(@sellerId, 'Surface Studio 2', 'Microsoft desktop', @pcId, @dellId, 40000000, 10, '/images/products/surface-studio-2.jpg', 'active'),
(@sellerId, 'iMac 27', 'Apple desktop', @pcId, @appleId, 38000000, 15, '/images/products/imac-27.jpg', 'active'),
(@sellerId, 'Mac mini M2', 'Mac mini', @pcId, @appleId, 12000000, 30, '/images/products/mac-mini-m2.jpg', 'active'),
(@sellerId, 'Mac Studio', 'Mac Studio', @pcId, @appleId, 25000000, 12, '/images/products/mac-studio.jpg', 'active'),
(@sellerId, 'Acer Aspire Desktop', 'Acer desktop', @pcId, @acerId, 12000000, 40, '/images/products/acer-aspire-desktop.jpg', 'active'),
(@sellerId, 'ASUS ExpertCenter', 'Business desktop', @pcId, @asusId, 18000000, 35, '/images/products/asus-expertcenter.jpg', 'active'),
(@sellerId, 'MSI MPG Trident', 'Gaming desktop', @pcId, @sonyId, 32000000, 20, '/images/products/msi-trident.jpg', 'active'),
(@sellerId, 'Corsair ONE i200', 'Corsair desktop', @pcId, @logitechId, 42000000, 8, '/images/products/corsair-one.jpg', 'active'),
(@sellerId, 'Alienware Aurora', 'Alienware gaming', @pcId, @dellId, 38000000, 15, '/images/products/alienware-aurora.jpg', 'active'),
(@sellerId, 'NZXT BLD', 'Custom PC', @pcId, @asusId, 25000000, 25, '/images/products/nzxt-bld.jpg', 'active'),
(@sellerId, 'Skytech Prism', 'Budget gaming PC', @pcId, @asusId, 15000000, 35, '/images/products/skytech-prism.jpg', 'active');

-- Màn hình (15 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'LG UltraWide 38"', 'LG ultrawide cao cấp', @screenId, @lgId, 15000000, 30, '/images/products/lg-ultrawide-38.jpg', 'active'),
(@sellerId, 'LG 34UP550', '34 inch ultrawide', @screenId, @lgId, 12000000, 35, '/images/products/lg-34up550.jpg', 'active'),
(@sellerId, 'Dell S3423DWC', 'Dell curved monitor', @screenId, @dellId, 12000000, 35, '/images/products/dell-s3423dwc.jpg', 'active'),
(@sellerId, 'Dell UltraSharp 32', 'UltraSharp cao cấp', @screenId, @dellId, 18000000, 25, '/images/products/dell-ultrasharp-32.jpg', 'active'),
(@sellerId, 'Asus PA247CV', 'Asus professional', @screenId, @asusId, 8000000, 25, '/images/products/asus-pa247cv.jpg', 'active'),
(@sellerId, 'BenQ SW240', 'BenQ designer monitor', @screenId, @lgId, 9000000, 20, '/images/products/benq-sw240.jpg', 'active'),
(@sellerId, 'Samsung M7', 'Samsung smart monitor', @screenId, @samsungId, 11000000, 30, '/images/products/samsung-m7.jpg', 'active'),
(@sellerId, 'LG 27UP550', '27 inch 4K', @screenId, @lgId, 10000000, 35, '/images/products/lg-27up550.jpg', 'active'),
(@sellerId, 'Dell S2722DGM', '27 inch gaming', @screenId, @dellId, 10000000, 40, '/images/products/dell-s2722dgm.jpg', 'active'),
(@sellerId, 'ASUS ROG Swift', 'ROG gaming monitor', @screenId, @asusId, 14000000, 25, '/images/products/asus-rog-swift.jpg', 'active'),
(@sellerId, 'MSI Oculux 360Hz', 'MSI 360Hz monitor', @screenId, @sonyId, 16000000, 20, '/images/products/msi-oculux-360.jpg', 'active'),
(@sellerId, 'LG 27UP550', '27 inch monitor', @screenId, @lgId, 8500000, 40, '/images/products/lg-27up550-std.jpg', 'active'),
(@sellerId, 'BenQ EW2780U', 'BenQ 4K monitor', @screenId, @lgId, 11000000, 30, '/images/products/benq-ew2780u.jpg', 'active'),
(@sellerId, 'Huawei MateView', 'Huawei display', @screenId, @xiaomiId, 7000000, 35, '/images/products/huawei-mateview.jpg', 'active'),
(@sellerId, 'Alienware AW3821DW', 'Alienware ultrawide', @screenId, @dellId, 20000000, 15, '/images/products/alienware-aw3821dw.jpg', 'active');

-- Điều hòa (8 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'LG Inverter 2HP V24', 'LG cao cấp', @acId, @lgId, 12000000, 35, '/images/products/lg-inverter-2hp.jpg', 'active'),
(@sellerId, 'LG Inverter 1HP', 'LG 1HP', @acId, @lgId, 8000000, 50, '/images/products/lg-inverter-1hp.jpg', 'active'),
(@sellerId, 'Samsung Inverter 2HP', 'Samsung cao cấp', @acId, @samsungId, 11000000, 40, '/images/products/samsung-inverter-2hp.jpg', 'active'),
(@sellerId, 'Samsung Inverter 1.5HP', 'Samsung 1.5HP', @acId, @samsungId, 9000000, 45, '/images/products/samsung-inverter-15hp.jpg', 'active'),
(@sellerId, 'Daikin Inverter 2HP', 'Daikin cao cấp', @acId, @lgId, 13000000, 30, '/images/products/daikin-inverter-2hp.jpg', 'active'),
(@sellerId, 'Daikin Inverter 1HP', 'Daikin 1HP', @acId, @lgId, 9000000, 50, '/images/products/daikin-inverter-1hp.jpg', 'active'),
(@sellerId, 'Panasonic Inverter', 'Panasonic AC', @acId, @sonyId, 10000000, 40, '/images/products/panasonic-inverter.jpg', 'active'),
(@sellerId, 'Midea Inverter', 'Midea entry level', @acId, @samsungId, 7000000, 60, '/images/products/midea-inverter.jpg', 'active');

-- Tủ lạnh (10 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'Samsung RF60A90R177', 'Samsung 4 cửa', @fridgeId, @samsungId, 25000000, 20, '/images/products/samsung-rf60a90r177.jpg', 'active'),
(@sellerId, 'Samsung RB30N4000S8', 'Samsung 2 cửa', @fridgeId, @samsungId, 12000000, 40, '/images/products/samsung-rb30n4000s8.jpg', 'active'),
(@sellerId, 'LG GR-X227GSV', 'LG 595L', @fridgeId, @lgId, 20000000, 25, '/images/products/lg-gr-x227gsv.jpg', 'active'),
(@sellerId, 'LG GR-B207SQYL', 'LG 2 cửa', @fridgeId, @lgId, 10000000, 45, '/images/products/lg-gr-b207sqyl.jpg', 'active'),
(@sellerId, 'Toshiba GR-RF532WE', 'Toshiba 4 cửa', @fridgeId, @sonyId, 18000000, 30, '/images/products/toshiba-gr-rf532we.jpg', 'active'),
(@sellerId, 'Panasonic NR-BZ600VGVN', 'Panasonic 6 cửa', @fridgeId, @sonyId, 22000000, 20, '/images/products/panasonic-nr-bz600.jpg', 'active'),
(@sellerId, 'Electrolux EBE2100SC', 'Electrolux 2 cửa', @fridgeId, @hpId, 11000000, 50, '/images/products/electrolux-ebe2100sc.jpg', 'active'),
(@sellerId, 'Midea MDRT524MIE0', 'Midea tiêu chuẩn', @fridgeId, @samsungId, 8000000, 60, '/images/products/midea-mdrt524mie0.jpg', 'active'),
(@sellerId, 'Sharp SJX680G', 'Sharp premium', @fridgeId, @sonyId, 16000000, 35, '/images/products/sharp-sjx680g.jpg', 'active'),
(@sellerId, 'Aqua AQR-IG525AM', 'Aqua entry level', @fridgeId, @oppoId, 6000000, 70, '/images/products/aqua-aqr-ig525am.jpg', 'active');

-- Máy giặt (10 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'Samsung WA21M8700GW', 'Samsung 21kg', @washerId, @samsungId, 18000000, 30, '/images/products/samsung-wa21m8700gw.jpg', 'active'),
(@sellerId, 'Samsung WA10T5260BW', 'Samsung 10kg', @washerId, @samsungId, 9000000, 50, '/images/products/samsung-wa10t5260bw.jpg', 'active'),
(@sellerId, 'LG FV1450S3W', 'LG 14.5kg', @washerId, @lgId, 16000000, 35, '/images/products/lg-fv1450s3w.jpg', 'active'),
(@sellerId, 'LG FC1409S3W', 'LG 9kg', @washerId, @lgId, 8000000, 55, '/images/products/lg-fc1409s3w.jpg', 'active'),
(@sellerId, 'Electrolux EWF12844', 'Electrolux 8kg', @washerId, @hpId, 7000000, 60, '/images/products/electrolux-ewf12844.jpg', 'active'),
(@sellerId, 'Toshiba TW-BK115G5V', 'Toshiba 11.5kg', @washerId, @sonyId, 13000000, 40, '/images/products/toshiba-tw-bk115g5v.jpg', 'active'),
(@sellerId, 'Panasonic NA-FD9001L', 'Panasonic 9kg', @washerId, @sonyId, 11000000, 45, '/images/products/panasonic-na-fd9001l.jpg', 'active'),
(@sellerId, 'Midea MFE80-1401', 'Midea 8kg', @washerId, @samsungId, 6000000, 70, '/images/products/midea-mfe80-1401.jpg', 'active'),
(@sellerId, 'Aqua AQW-F105BT', 'Aqua 10kg', @washerId, @oppoId, 5500000, 75, '/images/products/aqua-aqw-f105bt.jpg', 'active'),
(@sellerId, 'Sharp ES-FK1014SV', 'Sharp 10kg', @washerId, @sonyId, 7500000, 50, '/images/products/sharp-es-fk1014sv.jpg', 'active');

-- Phụ kiện điện thoại (12 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'Apple MagSafe Charger', 'Apple sạc từ', @phoneAccessoryId, @appleId, 1500000, 100, '/images/products/apple-magsafe.jpg', 'active'),
(@sellerId, 'Apple MagSafe Wallet', 'Apple ví từ', @phoneAccessoryId, @appleId, 1200000, 80, '/images/products/apple-magsafe-wallet.jpg', 'active'),
(@sellerId, 'Samsung Galaxy Buds2', 'Samsung tai nghe', @phoneAccessoryId, @samsungId, 3500000, 70, '/images/products/samsung-galaxy-buds2.jpg', 'active'),
(@sellerId, 'Spigen Armor Case', 'Ốp lưng', @phoneAccessoryId, @appleId, 500000, 200, '/images/products/spigen-armor.jpg', 'active'),
(@sellerId, 'Nillkin Tempered Glass', 'Cường lực', @phoneAccessoryId, @appleId, 300000, 300, '/images/products/nillkin-glass.jpg', 'active'),
(@sellerId, 'Anker PowerBank 20K', 'Pin dự phòng', @phoneAccessoryId, @logitechId, 1000000, 150, '/images/products/anker-powerbank.jpg', 'active'),
(@sellerId, 'Aukey USB-C Cable', 'Cáp USB-C', @phoneAccessoryId, @logitechId, 400000, 250, '/images/products/aukey-usb-c.jpg', 'active'),
(@sellerId, 'MOSHI iGlaze Case', 'Ốp lưng cao cấp', @phoneAccessoryId, @appleId, 800000, 100, '/images/products/moshi-iglaze.jpg', 'active'),
(@sellerId, 'ESR Magnetic Wallet', 'Ví sau lưng', @phoneAccessoryId, @appleId, 700000, 120, '/images/products/esr-wallet.jpg', 'active'),
(@sellerId, 'Belkin Car Vent', 'Giá đỡ ôtô', @phoneAccessoryId, @logitechId, 300000, 200, '/images/products/belkin-car-vent.jpg', 'active'),
(@sellerId, 'PopSocket Grip', 'Giá đỡ tay', @phoneAccessoryId, @appleId, 250000, 300, '/images/products/popsocket.jpg', 'active'),
(@sellerId, 'Casetify Screen', 'Bảo vệ màn hình', @phoneAccessoryId, @appleId, 600000, 150, '/images/products/casetify-screen.jpg', 'active');

-- Phụ kiện laptop (12 products)
INSERT INTO products (seller_id, name, description, category_id, brand_id, base_price, stock, image_url, status) VALUES
(@sellerId, 'Logitech MX Master 3S', 'Chuột cao cấp', @laptopAccessoryId, @logitechId, 2500000, 80, '/images/products/logitech-mx-master-3s.jpg', 'active'),
(@sellerId, 'Asus ProArt Backpack', 'Balo chuyên nghiệp', @laptopAccessoryId, @asusId, 2000000, 60, '/images/products/asus-proart-backpack.jpg', 'active'),
(@sellerId, 'Corsair Laptop Bag', 'Túi laptop', @laptopAccessoryId, @logitechId, 1500000, 100, '/images/products/corsair-bag.jpg', 'active'),
(@sellerId, 'Anker USB Hub', 'Hub USB', @laptopAccessoryId, @logitechId, 800000, 150, '/images/products/anker-usb-hub.jpg', 'active'),
(@sellerId, 'Belkin Dock 12-in-1', 'Dock đa năng', @laptopAccessoryId, @logitechId, 3500000, 40, '/images/products/belkin-dock.jpg', 'active'),
(@sellerId, 'Rain Design Laptop Stand', 'Giá đỡ laptop', @laptopAccessoryId, @appleId, 1200000, 120, '/images/products/rain-design-stand.jpg', 'active'),
(@sellerId, 'Razer Pro Click', 'Chuột thuyền', @laptopAccessoryId, @logitechId, 2000000, 70, '/images/products/razer-pro-click.jpg', 'active'),
(@sellerId, 'Keychron Mechanical', 'Bàn phím cơ', @laptopAccessoryId, @logitechId, 1800000, 90, '/images/products/keychron-mech.jpg', 'active'),
(@sellerId, 'Glorious Pad XL', 'Mouse pad', @laptopAccessoryId, @logitechId, 600000, 200, '/images/products/glorious-pad-xl.jpg', 'active'),
(@sellerId, 'Elago Laptop Stand', 'Giá đỡ nhôm', @laptopAccessoryId, @appleId, 900000, 150, '/images/products/elago-stand.jpg', 'active'),
(@sellerId, 'Wired USB Cable', 'Cáp USB', @laptopAccessoryId, @logitechId, 300000, 400, '/images/products/usb-cable.jpg', 'active'),
(@sellerId, 'HyperX Cooling Pad', 'Đế tản nhiệt', @laptopAccessoryId, @logitechId, 1500000, 100, '/images/products/hyperx-cooling-pad.jpg', 'active');
