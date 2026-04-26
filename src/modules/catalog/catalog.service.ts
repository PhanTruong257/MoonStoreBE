import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CatalogCategoriesResponseDto,
  CatalogModuleDetailResponseDto,
  CatalogModuleListResponseDto,
  CatalogProductDetailResponseDto,
  CatalogProductsResponseDto,
} from './dto/catalog-response.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCategoryFilterIds(
    categoryId?: number,
  ): Promise<number[] | undefined> {
    if (!categoryId) {
      return undefined;
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return [];
    }

    const childCategories = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });

    return [categoryId, ...childCategories.map((item) => item.id)];
  }

  async listCategories(): Promise<CatalogCategoriesResponseDto> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, parentId: true },
    });

    return { categories };
  }

  async listProducts(params?: {
    categoryId?: number;
    page?: number;
    limit?: number;
  }): Promise<CatalogProductsResponseDto> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 8;
    const categoryIds = await this.resolveCategoryFilterIds(params?.categoryId);

    const whereClause = {
      status: { in: ['active'] },
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
        },
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      page,
      limit,
      total,
      totalPages,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        status: product.status,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        brandId: product.brandId,
        brandName: product.brand.name,
        basePrice: Number(product.basePrice),
        stock: product.stock,
        imageUrl: product.imageUrl,
      })),
    };
  }

  async getProductDetail(id: number): Promise<CatalogProductDetailResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        optionGroups: {
          orderBy: { position: 'asc' },
          include: {
            options: { orderBy: { position: 'asc' } },
          },
        },
        reviews: { select: { rating: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const totalReviews = product.reviews.length;
    const averageRating =
      totalReviews > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        status: product.status,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        brandId: product.brandId,
        brandName: product.brand.name,
        basePrice: Number(product.basePrice),
        stock: product.stock,
        imageUrl: product.imageUrl,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        optionGroups: product.optionGroups.map((group) => ({
          id: group.id,
          name: group.name,
          position: group.position,
          required: group.required,
          multiSelect: group.multiSelect,
          options: group.options.map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: Number(option.priceDelta),
            position: option.position,
          })),
        })),
      },
    };
  }

  findAll(): CatalogModuleListResponseDto {
    return {
      module: 'catalog',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): CatalogModuleDetailResponseDto {
    return {
      module: 'catalog',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
