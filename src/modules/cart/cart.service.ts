import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CartAddItemResponseDto,
  CartModuleDetailResponseDto,
  CartModuleListResponseDto,
  CartRemoveItemResponseDto,
  CartResponseDto,
  CartUpdateItemResponseDto,
} from './dto/cart-response.dto';
import type { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUserId(userId?: number) {
    if (userId) {
      return userId;
    }

    const buyer = await this.prisma.user.findFirst({
      where: { role: 'buyer' },
      select: { id: true },
    });
    if (!buyer) {
      throw new BadRequestException('Buyer user not found.');
    }

    return buyer.id;
  }

  private async getOrCreateCart(userId: number) {
    return (
      (await this.prisma.cart.findFirst({ where: { userId } })) ??
      (await this.prisma.cart.create({ data: { userId } }))
    );
  }

  findAll(): CartModuleListResponseDto {
    return {
      module: 'cart',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): CartModuleDetailResponseDto {
    return {
      module: 'cart',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }

  async addItem(payload: AddToCartDto): Promise<CartAddItemResponseDto> {
    const quantity =
      payload.quantity && payload.quantity > 0 ? payload.quantity : 1;
    const userId = await this.resolveUserId(payload.userId);
    const cart = await this.getOrCreateCart(userId);

    let sku = payload.skuId
      ? await this.prisma.productSku.findUnique({
          where: { id: payload.skuId },
        })
      : null;

    if (!sku && payload.productId) {
      sku = await this.prisma.productSku.findFirst({
        where: { productId: payload.productId },
      });
    }

    if (!sku && payload.productName) {
      const product = await this.prisma.product.findFirst({
        where: { name: payload.productName },
      });

      if (product) {
        sku = await this.prisma.productSku.findFirst({
          where: { productId: product.id },
        });
      }

      if (!sku) {
        const seller = await this.prisma.seller.findFirst({
          select: { id: true },
        });
        if (!seller) {
          throw new BadRequestException('No seller available.');
        }

        const category =
          (await this.prisma.category.findFirst({
            where: { name: 'General' },
          })) ??
          (await this.prisma.category.create({ data: { name: 'General' } }));

        const brand =
          (await this.prisma.brand.findFirst({ where: { name: 'General' } })) ??
          (await this.prisma.brand.create({ data: { name: 'General' } }));

        const createdProduct = await this.prisma.product.create({
          data: {
            sellerId: seller.id,
            name: payload.productName,
            description: null,
            categoryId: category.id,
            brandId: brand.id,
            status: 'active',
          },
        });

        sku = await this.prisma.productSku.create({
          data: {
            productId: createdProduct.id,
            skuCode: `GEN-${createdProduct.id}`,
            price: new Prisma.Decimal(0),
            stock: 100,
            imageUrl: '/images/products/product-1.jpg',
          },
        });
      }
    }

    if (!sku) {
      throw new BadRequestException('SKU not found.');
    }

    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, skuId: sku.id },
    });

    const item = existingItem
      ? await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        })
      : await this.prisma.cartItem.create({
          data: { cartId: cart.id, skuId: sku.id, quantity },
        });

    return {
      cartId: cart.id,
      itemId: item.id,
      skuId: sku.id,
      quantity: item.quantity,
    };
  }

  async getCartByUser(userId: number): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        sku: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return {
      cartId: cart.id,
      userId: cart.userId,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        sku: {
          id: item.sku.id,
          price: Number(item.sku.price),
          stock: item.sku.stock,
          imageUrl: item.sku.imageUrl,
          product: item.sku.product,
        },
      })),
    };
  }

  async updateItemQuantity(
    itemId: number,
    quantity: number,
  ): Promise<CartUpdateItemResponseDto> {
    if (!quantity || quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    if (!existing) {
      throw new BadRequestException('Cart item not found.');
    }

    const item = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return { itemId: item.id, quantity: item.quantity };
  }

  async removeItem(itemId: number): Promise<CartRemoveItemResponseDto> {
    const existing = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    if (!existing) {
      throw new BadRequestException('Cart item not found.');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { itemId };
  }
}
