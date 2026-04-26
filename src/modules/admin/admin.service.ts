import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { ensureAdminRole } from '../../common/auth/admin-guard.helper';
import { extractUserIdFromRequest } from '../../common/auth/auth-token.helper';
import {
  SELLER_STATUS,
  USER_ROLE,
  USER_STATUS,
  type UserStatus,
} from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminPromoteAdminResponseDto,
  AdminSellerActionResponseDto,
  AdminSellerListResponseDto,
  AdminStatsResponseDto,
  AdminUserListResponseDto,
} from './dto/admin-response.dto';
import type { RejectSellerDto } from './dto/reject-seller.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private async assertAdmin(req: Request): Promise<number> {
    const userId = extractUserIdFromRequest(req, this.jwtService);
    await ensureAdminRole(this.prisma, userId);
    return userId;
  }

  async listUsers(req: Request, role?: string): Promise<AdminUserListResponseDto> {
    await this.assertAdmin(req);

    const users = await this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      })),
    };
  }

  async listSellers(req: Request, status?: string): Promise<AdminSellerListResponseDto> {
    await this.assertAdmin(req);

    const sellers = await this.prisma.seller.findMany({
      where: status ? { status } : undefined,
      orderBy: { id: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return {
      sellers: sellers.map((seller) => ({
        id: seller.id,
        userId: seller.userId,
        shopName: seller.shopName,
        description: seller.description,
        status: seller.status,
        rejectReason: seller.rejectReason,
        user: seller.user,
      })),
    };
  }

  async approveSeller(req: Request, sellerId: number): Promise<AdminSellerActionResponseDto> {
    await this.assertAdmin(req);

    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, userId: true, status: true },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found.');
    }
    if (seller.status === SELLER_STATUS.ACTIVE) {
      throw new BadRequestException('Seller is already active.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: seller.userId },
        data: { role: USER_ROLE.SELLER },
      });

      return tx.seller.update({
        where: { id: seller.id },
        data: { status: SELLER_STATUS.ACTIVE, rejectReason: null },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              role: true,
            },
          },
        },
      });
    });

    return {
      seller: {
        id: updated.id,
        userId: updated.userId,
        shopName: updated.shopName,
        description: updated.description,
        status: updated.status,
        rejectReason: updated.rejectReason,
        user: updated.user,
      },
    };
  }

  async rejectSeller(
    req: Request,
    sellerId: number,
    payload: RejectSellerDto
  ): Promise<AdminSellerActionResponseDto> {
    await this.assertAdmin(req);

    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, status: true },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found.');
    }
    if (seller.status === SELLER_STATUS.REJECTED) {
      throw new BadRequestException('Seller is already rejected.');
    }

    const updated = await this.prisma.seller.update({
      where: { id: seller.id },
      data: {
        status: SELLER_STATUS.REJECTED,
        rejectReason: payload.reason?.trim() ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return {
      seller: {
        id: updated.id,
        userId: updated.userId,
        shopName: updated.shopName,
        description: updated.description,
        status: updated.status,
        rejectReason: updated.rejectReason,
        user: updated.user,
      },
    };
  }

  async promoteToAdmin(req: Request, userId: number): Promise<AdminPromoteAdminResponseDto> {
    await this.assertAdmin(req);

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) {
      throw new NotFoundException('User not found.');
    }
    if (target.role === USER_ROLE.ADMIN) {
      throw new ConflictException('User is already an admin.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: USER_ROLE.ADMIN },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        phone: updated.phone,
        role: updated.role,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
      },
    };
  }

  async getStats(req: Request): Promise<AdminStatsResponseDto> {
    await this.assertAdmin(req);

    const [totalUsers, totalSellers, pendingSellers, totalAdmins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.seller.count({
        where: { status: SELLER_STATUS.ACTIVE },
      }),
      this.prisma.seller.count({
        where: { status: SELLER_STATUS.PENDING },
      }),
      this.prisma.user.count({ where: { role: USER_ROLE.ADMIN } }),
    ]);

    return { totalUsers, totalSellers, pendingSellers, totalAdmins };
  }

  async setUserStatus(
    req: Request,
    userId: number,
    nextStatus: UserStatus,
  ): Promise<AdminPromoteAdminResponseDto> {
    const adminUserId = await this.assertAdmin(req);

    if (adminUserId === userId) {
      throw new BadRequestException('You cannot disable yourself.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!target) {
      throw new NotFoundException('User not found.');
    }
    if (target.status === nextStatus) {
      throw new BadRequestException(`User is already ${nextStatus}.`);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: nextStatus },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        phone: updated.phone,
        role: updated.role,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
      },
    };
  }

  async setSellerStatus(
    req: Request,
    sellerId: number,
    nextStatus: typeof SELLER_STATUS.ACTIVE | typeof SELLER_STATUS.DISABLED,
  ): Promise<AdminSellerActionResponseDto> {
    await this.assertAdmin(req);

    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, status: true },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found.');
    }
    if (seller.status === nextStatus) {
      throw new BadRequestException(`Seller is already ${nextStatus}.`);
    }
    if (
      seller.status === SELLER_STATUS.PENDING ||
      seller.status === SELLER_STATUS.REJECTED
    ) {
      throw new BadRequestException('Use approve/reject endpoints for pending/rejected sellers.');
    }

    const updated = await this.prisma.seller.update({
      where: { id: sellerId },
      data: { status: nextStatus },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return {
      seller: {
        id: updated.id,
        userId: updated.userId,
        shopName: updated.shopName,
        description: updated.description,
        status: updated.status,
        rejectReason: updated.rejectReason,
        user: updated.user,
      },
    };
  }
}
