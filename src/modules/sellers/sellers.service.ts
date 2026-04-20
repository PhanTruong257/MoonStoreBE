import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateProductResponseDto,
  CreateSellerResponseDto,
  SellersModuleDetailResponseDto,
  SellersModuleListResponseDto,
} from './dto/sellers-response.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { CreateSellerDto } from './dto/create-seller.dto';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): SellersModuleListResponseDto {
    return {
      module: 'sellers',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): SellersModuleDetailResponseDto {
    return {
      module: 'sellers',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }

  async createSellerProfile(
    payload: CreateSellerDto,
  ): Promise<CreateSellerResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const existing = await this.prisma.seller.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Seller profile already exists.');
    }

    const seller = await this.prisma.seller.create({
      data: {
        userId: payload.userId,
        shopName: payload.shopName.trim(),
        description: payload.description?.trim() ?? null,
        status: 'active',
      },
      select: {
        id: true,
        userId: true,
        shopName: true,
        description: true,
        status: true,
      },
    });

    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { role: 'seller' },
    });

    return { seller };
  }

  async createProduct(
    payload: CreateProductDto,
  ): Promise<CreateProductResponseDto> {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });
    if (!seller) {
      throw new BadRequestException('Seller profile not found.');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: payload.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Category not found.');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: payload.brandId },
      select: { id: true },
    });
    if (!brand) {
      throw new BadRequestException('Brand not found.');
    }

    const product = await this.prisma.product.create({
      data: {
        sellerId: seller.id,
        name: payload.name.trim(),
        description: payload.description?.trim() ?? null,
        categoryId: payload.categoryId,
        brandId: payload.brandId,
        status: payload.status?.trim() ?? 'active',
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        description: true,
        status: true,
        categoryId: true,
        brandId: true,
      },
    });

    const sku = await this.prisma.productSku.create({
      data: {
        productId: product.id,
        skuCode: payload.skuCode?.trim() ?? `SKU-${product.id}`,
        price: new Prisma.Decimal(payload.price),
        stock: payload.stock,
        imageUrl: payload.imageUrl.trim(),
      },
      select: {
        id: true,
        productId: true,
        skuCode: true,
        price: true,
        stock: true,
        imageUrl: true,
      },
    });

    return {
      product,
      sku: {
        ...sku,
        price: Number(sku.price),
      },
    };
  }
}
