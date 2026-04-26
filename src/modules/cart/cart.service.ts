import { BadRequestException, Injectable } from '@nestjs/common';

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

    const fallback = await this.prisma.user.findFirst({
      where: { role: 'user' },
      select: { id: true },
    });
    if (!fallback) {
      throw new BadRequestException('User not found.');
    }

    return fallback.id;
  }

  private async getOrCreateCart(userId: number) {
    return (
      (await this.prisma.cart.findFirst({ where: { userId } })) ??
      (await this.prisma.cart.create({ data: { userId } }))
    );
  }

  private async validateOptionsBelongToProduct(productId: number, optionIds: number[]) {
    if (optionIds.length === 0) {
      return;
    }

    const options = await this.prisma.option.findMany({
      where: { id: { in: optionIds } },
      select: { id: true, group: { select: { productId: true } } },
    });

    if (options.length !== optionIds.length) {
      throw new BadRequestException('One or more options not found.');
    }

    const wrong = options.find((option) => option.group.productId !== productId);
    if (wrong) {
      throw new BadRequestException('Selected option is not valid for product.');
    }
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
    const quantity = payload.quantity && payload.quantity > 0 ? payload.quantity : 1;
    const userId = await this.resolveUserId(payload.userId);
    const cart = await this.getOrCreateCart(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: payload.productId },
      select: { id: true },
    });
    if (!product) {
      throw new BadRequestException('Product not found.');
    }

    const optionIds = (payload.optionIds ?? [])
      .filter((id) => Number.isFinite(id))
      .map((id) => Number(id));
    await this.validateOptionsBelongToProduct(product.id, optionIds);
    const dedupedOptionIds = Array.from(new Set(optionIds)).sort((a, b) => a - b);

    const existingItems = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id, productId: product.id },
      include: { selectedOptions: true },
    });

    const matched = existingItems.find((item) => {
      const ids = item.selectedOptions.map((entry) => entry.optionId).sort((a, b) => a - b);
      if (ids.length !== dedupedOptionIds.length) {
        return false;
      }
      return ids.every((value, index) => value === dedupedOptionIds[index]);
    });

    const item = matched
      ? await this.prisma.cartItem.update({
          where: { id: matched.id },
          data: { quantity: matched.quantity + quantity },
        })
      : await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            quantity,
            selectedOptions: {
              create: dedupedOptionIds.map((optionId) => ({ optionId })),
            },
          },
        });

    return {
      cartId: cart.id,
      itemId: item.id,
      productId: product.id,
      quantity: item.quantity,
    };
  }

  async getCartByUser(userId: number): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            stock: true,
            imageUrl: true,
          },
        },
        selectedOptions: {
          include: {
            option: {
              select: {
                id: true,
                name: true,
                priceDelta: true,
                group: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return {
      cartId: cart.id,
      userId: cart.userId,
      items: items.map((item) => {
        const optionsTotal = item.selectedOptions.reduce(
          (sum, entry) => sum + Number(entry.option.priceDelta),
          0
        );
        const unitPrice = Number(item.product.basePrice) + optionsTotal;

        return {
          id: item.id,
          quantity: item.quantity,
          unitPrice,
          product: {
            id: item.product.id,
            name: item.product.name,
            basePrice: Number(item.product.basePrice),
            stock: item.product.stock,
            imageUrl: item.product.imageUrl,
          },
          selectedOptions: item.selectedOptions.map((entry) => ({
            optionId: entry.option.id,
            groupName: entry.option.group.name,
            optionName: entry.option.name,
            priceDelta: Number(entry.option.priceDelta),
          })),
        };
      }),
    };
  }

  async updateItemQuantity(itemId: number, quantity: number): Promise<CartUpdateItemResponseDto> {
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
