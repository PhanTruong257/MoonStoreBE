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
      status: 'active',
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          skus: {
            select: { id: true, price: true, stock: true, imageUrl: true },
            take: 1,
            orderBy: { id: 'asc' },
          },
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
        defaultSku: product.skus[0]
          ? {
              ...product.skus[0],
              price: Number(product.skus[0].price),
            }
          : null,
      })),
    };
  }

  async getProductDetail(id: number): Promise<CatalogProductDetailResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        skus: {
          include: {
            skuAttributeValues: {
              include: {
                attributeValue: {
                  include: { attribute: true },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const optionGroupsMap = new Map<string, Set<string>>();
    for (const sku of product.skus) {
      for (const item of sku.skuAttributeValues) {
        const groupName = item.attributeValue.attribute.name;
        const optionValue = item.attributeValue.value;
        if (!optionGroupsMap.has(groupName)) {
          optionGroupsMap.set(groupName, new Set<string>());
        }
        optionGroupsMap.get(groupName)?.add(optionValue);
      }
    }

    const optionGroups = Array.from(optionGroupsMap.entries()).map(
      ([name, values]) => ({
        name,
        options: Array.from(values).map((value) => ({ value })),
      }),
    );

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
        skus: product.skus.map((sku) => ({
          id: sku.id,
          price: Number(sku.price),
          stock: sku.stock,
          imageUrl: sku.imageUrl,
          attributes: sku.skuAttributeValues.map((item) => ({
            name: item.attributeValue.attribute.name,
            value: item.attributeValue.value,
          })),
        })),
        optionGroups,
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
