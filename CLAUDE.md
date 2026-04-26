# CLAUDE.md — Backend (moon-store-be)

Tài liệu này bổ sung cho [CLAUDE.md gốc](../CLAUDE.md). Đọc file gốc trước.

## 1. Stack

- **NestJS 11** (modular, controller-service-module pattern)
- **Prisma 6** (MySQL provider, schema ở `prisma/schema.prisma`)
- **JWT** (qua `@nestjs/jwt`) — access token lưu trong cookie `access_token`
- **bcryptjs** — hash password
- **Swagger** — doc tại `/api/docs` (khi bật)
- **pnpm** — package manager

## 2. Cấu trúc thư mục

```
src/
├── app.module.ts           # Root module, đăng ký tất cả feature modules
├── main.ts                 # Bootstrap, cookie-parser, cors, swagger
├── prisma/
│   ├── prisma.module.ts    # Global module
│   └── prisma.service.ts   # PrismaClient wrapper
└── modules/
    ├── auth/
    ├── users/
    ├── sellers/
    ├── catalog/
    ├── cart/
    ├── orders/
    ├── payments/
    ├── shipments/
    ├── reviews/
    ├── vouchers/
    ├── search/
    └── chat/
```

**Mỗi feature module chứa**:
```
<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
└── dto/
    ├── create-<x>.dto.ts
    ├── update-<x>.dto.ts
    └── <feature>-response.dto.ts
```

## 3. Controller

- **Controller mỏng**: chỉ nhận request, gọi service, trả response. Không có logic nghiệp vụ.
- Dùng `@Req() req: Request` (từ `express`) khi cần access cookie/token.
- Param số: dùng `@Param('id', ParseIntPipe)`.
- Body: dùng `@Body() payload: XxxDto` với DTO type-only import (`import type`).
- Decorator route: dùng dạng số nhiều (`/orders`, `/products`) cho collection.

```ts
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Req() req: Request,
    @Body() payload: CreateOrderDto,
  ): Promise<OrderCreateResponseDto> {
    return this.ordersService.createOrder(req, payload);
  }
}
```

## 4. Service

- **Mọi logic nghiệp vụ viết ở service**.
- Inject `PrismaService` và các service khác qua constructor.
- **Dùng `@nestjs/common` exceptions** thay vì throw `Error` thường:
  - `BadRequestException` — dữ liệu input sai
  - `UnauthorizedException` — chưa đăng nhập / token hỏng
  - `ForbiddenException` — đăng nhập rồi nhưng không đủ quyền
  - `NotFoundException` — tài nguyên không tồn tại
  - `ConflictException` — vi phạm unique constraint (email trùng, seller đã tồn tại...)
- **Transaction**: nghiệp vụ phức tạp dùng `this.prisma.$transaction(async (tx) => {...})`. Đọc/ghi trong transaction phải dùng `tx`, không dùng `this.prisma`.

## 5. DTO

- **Tách DTO theo mục đích**: `create-x.dto.ts`, `update-x.dto.ts`, `x-response.dto.ts`.
- DTO hiện tại chỉ là **type interface** (chưa dùng class-validator). Khi thêm validation:
  ```ts
  export class CreateOrderDto {
    @IsOptional() @IsInt() voucherId?: number;
    @IsOptional() @IsNumber() shippingFee?: number;
  }
  ```
  Và bật `ValidationPipe` global ở `main.ts`.
- Response DTO không kế thừa entity Prisma — **luôn declare lại** để control được field exposed.

## 6. Prisma patterns

### 6.1. Select rõ ràng
Không dùng `include: { ... : true }` lan tràn. Dùng `select` để lấy đúng field cần:

```ts
await this.prisma.order.findUnique({
  where: { id },
  select: {
    id: true,
    totalAmount: true,
    orderGroups: {
      select: { id: true, status: true, sellerId: true },
    },
  },
});
```

### 6.2. Decimal & JSON
- **Decimal**: đọc dùng `Number(value)` khi trả về client, ghi dùng `new Prisma.Decimal(value)`.
- **JSON nullable**: gán `Prisma.DbNull` khi muốn NULL, **không dùng `null`**.

```ts
// SAI
shippingAddress: payload.shippingAddress ?? null,

// ĐÚNG
shippingAddress:
  (payload.shippingAddress as Prisma.InputJsonValue) ?? Prisma.DbNull,
```

### 6.3. Relation
- Mỗi relation phải khai báo **cả 2 phía**. Nếu thiếu, Prisma sẽ báo lỗi `P1012` khi `prisma generate`.

## 7. Auth & ownership

### 7.1. Lấy userId từ request

Pattern hiện tại (chưa có guard chính thức):
```ts
private getUserIdFromRequest(req: Request) {
  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.[ACCESS_COOKIE_NAME];
  if (!token) throw new UnauthorizedException('Missing access token.');
  try {
    const payload = this.jwtService.verify<{ sub: number }>(token, {
      secret: this.getAccessSecret(),
    });
    return payload.sub;
  } catch {
    throw new UnauthorizedException('Invalid access token.');
  }
}
```

> **TODO**: tách thành `AuthGuard` + `@CurrentUser()` decorator để không lặp code.

### 7.2. Kiểm tra quyền seller

```ts
private async getSellerIdForUser(userId: number) {
  const seller = await this.prisma.seller.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!seller) throw new ForbiddenException('Seller profile not found.');
  return seller.id;
}
```

### 7.3. Ownership check
- Trước khi cho seller xem/sửa resource, **luôn verify** resource thuộc seller đó:
  ```ts
  const group = await tx.orderGroup.findUnique({ where: { id: groupId } });
  if (!group || group.sellerId !== sellerId) {
    throw new ForbiddenException('Not your order.');
  }
  ```

## 8. Response format

- Trả về object trực tiếp (không wrap `{ data: ... }`) — giữ consistent với code hiện tại.
- Error dùng exception của Nest → tự động format.
- **Không** trả entity Prisma thô khi có `Decimal` / `DateTime` — convert sang kiểu JSON-friendly trước.

## 9. Script thường dùng

```bash
pnpm install                  # cài dependency
pnpm run start:dev            # dev + watch
pnpm run build                # build production
pnpm run prisma:generate      # generate Prisma client (chạy sau khi sửa schema)
pnpm run prisma:push          # sync schema → DB (dev only)
pnpm run prisma:seed          # seed dữ liệu mẫu
pnpm run lint                 # eslint --fix
pnpm run format               # prettier --write
```

## 10. Thêm feature mới — checklist

1. Sửa `prisma/schema.prisma` (nếu cần) → `pnpm run prisma:generate`.
2. Tạo folder `src/modules/<feature>/` với module + controller + service + dto.
3. Đăng ký module vào [`app.module.ts`](src/app.module.ts).
4. Kiểm tra auth/ownership nếu là API cần login.
5. Chạy `pnpm run build` — đảm bảo không lỗi TS.
6. Test thủ công bằng Postman / Swagger / FE.
