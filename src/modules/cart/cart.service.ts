import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return {
      module: 'cart',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'cart',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }

  async addItem(payload: AddToCartDto) {
    const quantity = payload.quantity && payload.quantity > 0 ? payload.quantity : 1;

    let userId = payload.userId;
    if (!userId) {
      const buyer = await this.prisma.user.findFirst({
        where: { role: 'buyer' },
        select: { id: true },
      });
      if (!buyer) {
        throw new BadRequestException('Buyer user not found.');
      }
      userId = buyer.id;
    }

    const cart =
      (await this.prisma.cart.findFirst({ where: { userId } })) ??
      (await this.prisma.cart.create({ data: { userId } }));

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
          })) ?? (await this.prisma.category.create({ data: { name: 'General' } }));

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
}
