import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, parentId: true },
    });

    return { categories };
  }

  async listProducts() {
    const products = await this.prisma.product.findMany({
      where: { status: 'active' },
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
    });

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        status: product.status,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        brandId: product.brandId,
        brandName: product.brand.name,
        defaultSku: product.skus[0] ?? null,
      })),
    };
  }

  async getProductDetail(id: number) {
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
          price: sku.price,
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

  findAll() {
    return {
      module: 'catalog',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'catalog',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
