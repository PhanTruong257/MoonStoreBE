# 1. Dùng Node bản lightweight
FROM node:20-alpine

# 2. Cài đặt pnpm toàn cục trong container
RUN npm install -g pnpm

# 3. Tạo thư mục làm việc
WORKDIR /usr/src/app

# 4. Copy các file quản lý package vào trước
COPY package.json pnpm-lock.yaml ./

# 5. Dùng pnpm để cài đặt dependencies
RUN pnpm install

# 6. Copy toàn bộ mã nguồn vào container (bao gồm cả file .env vừa tạo)
COPY . .

# 7. Sinh Prisma Client chuẩn chỉnh (Không dùng || true để nếu lỗi là biết ngay)
RUN npx prisma generate

# 8. Build dự án NestJS ra thư mục dist
RUN pnpm run build

# 9. Mở cổng 2000 đồng bộ với cấu hình hệ thống
EXPOSE 2000

# 10. Chạy ứng dụng bản Production
# Sửa dòng số 10 cuối cùng thành dòng này:
CMD ["node", "dist/src/main.js"]
