import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { ensureAdminRole } from '../../common/auth/admin-guard.helper';
import { extractUserIdFromRequest } from '../../common/auth/auth-token.helper';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminBrandListResponseDto,
  AdminBrandResponseDto,
  CreateBrandDto,
  UpdateBrandDto,
} from './dto/brand.dto';

@Injectable()
export class AdminBrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private async assertAdmin(req: Request): Promise<void> {
    const userId = extractUserIdFromRequest(req, this.jwtService);
    await ensureAdminRole(this.prisma, userId);
  }

  async list(req: Request): Promise<AdminBrandListResponseDto> {
    await this.assertAdmin(req);

    const brands = await this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    const ids = brands.map((b) => b.id);
    const counts = await this.prisma.product.groupBy({
      by: ['brandId'],
      where: { brandId: { in: ids } },
      _count: { _all: true },
    });
    const map = new Map(counts.map((c) => [c.brandId, c._count._all]));

    return {
      brands: brands.map((b) => ({
        id: b.id,
        name: b.name,
        productCount: map.get(b.id) ?? 0,
      })),
    };
  }

  async create(req: Request, payload: CreateBrandDto): Promise<AdminBrandResponseDto> {
    await this.assertAdmin(req);

    const name = payload.name?.trim();
    if (!name) {
      throw new BadRequestException('Name is required.');
    }

    const created = await this.prisma.brand.create({ data: { name } });
    return {
      brand: { id: created.id, name: created.name, productCount: 0 },
    };
  }

  async update(req: Request, id: number, payload: UpdateBrandDto): Promise<AdminBrandResponseDto> {
    await this.assertAdmin(req);

    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Brand not found.');
    }

    const name = payload.name?.trim();
    if (name !== undefined && !name) {
      throw new BadRequestException('Name cannot be empty.');
    }

    const updated = await this.prisma.brand.update({
      where: { id },
      data: { ...(name ? { name } : {}) },
    });
    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });
    return {
      brand: { id: updated.id, name: updated.name, productCount },
    };
  }

  async delete(req: Request, id: number): Promise<{ id: number }> {
    await this.assertAdmin(req);

    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });
    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete: ${productCount} product(s) still use this brand.`
      );
    }

    await this.prisma.brand.delete({ where: { id } });
    return { id };
  }
}
