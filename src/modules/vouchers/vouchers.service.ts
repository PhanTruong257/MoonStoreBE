import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type { ValidateVoucherDto } from './dto/validate-voucher.dto';
import type {
  VoucherValidateResponseDto,
  VouchersModuleDetailResponseDto,
  VouchersModuleListResponseDto,
} from './dto/vouchers-response.dto';

const DISCOUNT_TYPE_PERCENT = 'percent';
const DISCOUNT_TYPE_FIXED = 'fixed';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): VouchersModuleListResponseDto {
    return {
      module: 'vouchers',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): VouchersModuleDetailResponseDto {
    return {
      module: 'vouchers',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }

  async validateVoucher(
    payload: ValidateVoucherDto,
  ): Promise<VoucherValidateResponseDto> {
    const code = payload.code?.trim().toUpperCase();
    const subtotal = Number(payload.subtotal ?? 0);

    if (!code) {
      return {
        isValid: false,
        reason: 'Coupon code is required.',
        voucher: null,
        discountAmount: 0,
      };
    }

    const voucher = await this.prisma.voucher.findFirst({
      where: { code },
    });

    if (!voucher) {
      return {
        isValid: false,
        reason: 'Coupon not found.',
        voucher: null,
        discountAmount: 0,
      };
    }

    if (voucher.expiredAt.getTime() < Date.now()) {
      return {
        isValid: false,
        reason: 'Coupon has expired.',
        voucher: null,
        discountAmount: 0,
      };
    }

    const discountAmount = this.computeDiscount(
      voucher.discountType,
      Number(voucher.value),
      voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
      subtotal,
    );

    return {
      isValid: true,
      reason: null,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        value: Number(voucher.value),
        maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
        expiredAt: voucher.expiredAt.toISOString(),
      },
      discountAmount,
    };
  }

  computeDiscount(
    discountType: string,
    value: number,
    maxDiscount: number | null,
    subtotal: number,
  ): number {
    if (subtotal <= 0) {
      return 0;
    }

    if (discountType === DISCOUNT_TYPE_PERCENT) {
      const raw = Math.round((subtotal * value) / 100);
      if (maxDiscount && raw > maxDiscount) {
        return maxDiscount;
      }
      return raw;
    }

    if (discountType === DISCOUNT_TYPE_FIXED) {
      return Math.min(value, subtotal);
    }

    return 0;
  }
}
