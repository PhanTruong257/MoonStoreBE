import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

import { ensureAdminRole } from '../../common/auth/admin-guard.helper';
import { extractUserIdFromRequest } from '../../common/auth/auth-token.helper';
import { VOUCHER_DISCOUNT_TYPES } from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminVoucherListResponseDto,
  AdminVoucherResponseDto,
  AdminVoucherUsageListResponseDto,
  CreateVoucherDto,
  UpdateVoucherDto,
} from './dto/voucher.dto';

@Injectable()
export class AdminVouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private async assertAdmin(req: Request): Promise<void> {
    const userId = extractUserIdFromRequest(req, this.jwtService);
    await ensureAdminRole(this.prisma, userId);
  }

  private validateDiscountType(type: string): void {
    if (!(VOUCHER_DISCOUNT_TYPES as string[]).includes(type)) {
      throw new BadRequestException(
        `discountType must be one of: ${VOUCHER_DISCOUNT_TYPES.join(', ')}`,
      );
    }
  }

  async list(req: Request): Promise<AdminVoucherListResponseDto> {
    await this.assertAdmin(req);

    const vouchers = await this.prisma.voucher.findMany({
      orderBy: { id: 'desc' },
    });
    const ids = vouchers.map((v) => v.id);
    const usageCounts = await this.prisma.voucherUsage.groupBy({
      by: ['voucherId'],
      where: { voucherId: { in: ids } },
      _count: { _all: true },
    });
    const map = new Map(usageCounts.map((u) => [u.voucherId, u._count._all]));

    return {
      vouchers: vouchers.map((v) => ({
        id: v.id,
        code: v.code,
        discountType: v.discountType,
        value: Number(v.value),
        maxDiscount: v.maxDiscount === null ? null : Number(v.maxDiscount),
        expiredAt: v.expiredAt.toISOString(),
        usageCount: map.get(v.id) ?? 0,
      })),
    };
  }

  async create(req: Request, payload: CreateVoucherDto): Promise<AdminVoucherResponseDto> {
    await this.assertAdmin(req);

    const code = payload.code?.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('Code is required.');
    }
    this.validateDiscountType(payload.discountType);
    if (typeof payload.value !== 'number' || payload.value < 0) {
      throw new BadRequestException('value must be a non-negative number.');
    }
    const expiredAt = new Date(payload.expiredAt);
    if (Number.isNaN(expiredAt.getTime())) {
      throw new BadRequestException('expiredAt is invalid.');
    }

    const created = await this.prisma.voucher.create({
      data: {
        code,
        discountType: payload.discountType,
        value: new Prisma.Decimal(payload.value),
        maxDiscount:
          payload.maxDiscount !== undefined && payload.maxDiscount !== null
            ? new Prisma.Decimal(payload.maxDiscount)
            : null,
        expiredAt,
      },
    });

    return {
      voucher: {
        id: created.id,
        code: created.code,
        discountType: created.discountType,
        value: Number(created.value),
        maxDiscount: created.maxDiscount === null ? null : Number(created.maxDiscount),
        expiredAt: created.expiredAt.toISOString(),
        usageCount: 0,
      },
    };
  }

  async update(
    req: Request,
    id: number,
    payload: UpdateVoucherDto
  ): Promise<AdminVoucherResponseDto> {
    await this.assertAdmin(req);

    const existing = await this.prisma.voucher.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Voucher not found.');
    }

    const data: Prisma.VoucherUpdateInput = {};
    if (payload.code !== undefined) {
      const code = payload.code.trim().toUpperCase();
      if (!code) {
        throw new BadRequestException('Code cannot be empty.');
      }
      data.code = code;
    }
    if (payload.discountType !== undefined) {
      this.validateDiscountType(payload.discountType);
      data.discountType = payload.discountType;
    }
    if (payload.value !== undefined) {
      if (payload.value < 0) {
        throw new BadRequestException('value must be non-negative.');
      }
      data.value = new Prisma.Decimal(payload.value);
    }
    if (payload.maxDiscount !== undefined) {
      data.maxDiscount =
        payload.maxDiscount === null ? null : new Prisma.Decimal(payload.maxDiscount);
    }
    if (payload.expiredAt !== undefined) {
      const expiredAt = new Date(payload.expiredAt);
      if (Number.isNaN(expiredAt.getTime())) {
        throw new BadRequestException('expiredAt is invalid.');
      }
      data.expiredAt = expiredAt;
    }

    const updated = await this.prisma.voucher.update({ where: { id }, data });
    const usageCount = await this.prisma.voucherUsage.count({
      where: { voucherId: id },
    });

    return {
      voucher: {
        id: updated.id,
        code: updated.code,
        discountType: updated.discountType,
        value: Number(updated.value),
        maxDiscount: updated.maxDiscount === null ? null : Number(updated.maxDiscount),
        expiredAt: updated.expiredAt.toISOString(),
        usageCount,
      },
    };
  }

  async delete(req: Request, id: number): Promise<{ id: number }> {
    await this.assertAdmin(req);

    const usageCount = await this.prisma.voucherUsage.count({
      where: { voucherId: id },
    });
    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete: voucher has been used ${usageCount} time(s). Set expiredAt to past instead.`
      );
    }

    await this.prisma.voucher.delete({ where: { id } });
    return { id };
  }

  async listUsages(req: Request, voucherId: number): Promise<AdminVoucherUsageListResponseDto> {
    await this.assertAdmin(req);

    const usages = await this.prisma.voucherUsage.findMany({
      where: { voucherId },
      orderBy: { id: 'desc' },
      include: {
        user: { select: { email: true, fullName: true } },
      },
    });

    return {
      usages: usages.map((u) => ({
        id: u.id,
        userId: u.userId,
        orderId: u.orderId,
        userEmail: u.user.email,
        userFullName: u.user.fullName,
      })),
    };
  }
}
