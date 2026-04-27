import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { assertAdminFromRequest } from '../../common/auth/request-user.helper';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminCategoryListResponseDto,
  AdminCategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private async assertAdmin(req: Request): Promise<void> {
    await assertAdminFromRequest(req, this.jwtService, this.prisma);
  }

  private async toDto(categoryId: number) {
    const [category, productCount, childCount] = await Promise.all([
      this.prisma.category.findUniqueOrThrow({ where: { id: categoryId } }),
      this.prisma.product.count({ where: { categoryId } }),
      this.prisma.category.count({ where: { parentId: categoryId } }),
    ]);
    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      productCount,
      childCount,
    };
  }

  async list(req: Request): Promise<AdminCategoryListResponseDto> {
    await this.assertAdmin(req);

    const categories = await this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });
    const ids = categories.map((c) => c.id);
    const productCounts = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: ids } },
      _count: { _all: true },
    });
    const childCounts = await this.prisma.category.groupBy({
      by: ['parentId'],
      where: { parentId: { in: ids } },
      _count: { _all: true },
    });
    const productMap = new Map(productCounts.map((p) => [p.categoryId, p._count._all]));
    const childMap = new Map(childCounts.map((c) => [c.parentId, c._count._all]));

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        productCount: productMap.get(c.id) ?? 0,
        childCount: childMap.get(c.id) ?? 0,
      })),
    };
  }

  async create(req: Request, payload: CreateCategoryDto): Promise<AdminCategoryResponseDto> {
    await this.assertAdmin(req);

    const name = payload.name?.trim();
    if (!name) {
      throw new BadRequestException('Name is required.');
    }

    if (payload.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: payload.parentId },
        select: { id: true },
      });
      if (!parent) {
        throw new BadRequestException('Parent not found.');
      }
    }

    const created = await this.prisma.category.create({
      data: { name, parentId: payload.parentId ?? null },
    });
    return { category: await this.toDto(created.id) };
  }

  async update(
    req: Request,
    id: number,
    payload: UpdateCategoryDto
  ): Promise<AdminCategoryResponseDto> {
    await this.assertAdmin(req);

    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category not found.');
    }

    if (payload.parentId === id) {
      throw new BadRequestException('Category cannot be its own parent.');
    }

    if (payload.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: payload.parentId },
        select: { id: true },
      });
      if (!parent) {
        throw new BadRequestException('Parent not found.');
      }
    }

    const data: { name?: string; parentId?: number | null } = {};
    if (payload.name !== undefined) {
      const name = payload.name.trim();
      if (!name) {
        throw new BadRequestException('Name cannot be empty.');
      }
      data.name = name;
    }
    if (payload.parentId !== undefined) {
      data.parentId = payload.parentId ?? null;
    }

    await this.prisma.category.update({ where: { id }, data });
    return { category: await this.toDto(id) };
  }

  async delete(req: Request, id: number): Promise<{ id: number }> {
    await this.assertAdmin(req);

    const [productCount, childCount] = await Promise.all([
      this.prisma.product.count({ where: { categoryId: id } }),
      this.prisma.category.count({ where: { parentId: id } }),
    ]);

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete: ${productCount} product(s) still in this category.`
      );
    }
    if (childCount > 0) {
      throw new BadRequestException(`Cannot delete: ${childCount} child categor(ies) exist.`);
    }

    await this.prisma.category.delete({ where: { id } });
    return { id };
  }
}
