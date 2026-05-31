import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { assertAdminFromRequest } from '../../common/auth/request-user.helper';
import {
  REFUND_REQUEST_STATUS,
  RETURN_REQUEST_STATUS,
  SELLER_STATUS,
  SHIPPER_STATUS,
  USER_ROLE,
  USER_STATUS,
  WITHDRAWAL_STATUS,
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
    return assertAdminFromRequest(req, this.jwtService, this.prisma);
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
    nextStatus: UserStatus
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

  async getCommissionRate(req: Request) {
    await this.assertAdmin(req);
    const config = await this.prisma.platformConfig.findFirst();
    return { commissionRate: config ? Number(config.commissionRate) : 10 };
  }

  async setCommissionRate(req: Request, rate: number) {
    await this.assertAdmin(req);
    if (rate < 0 || rate > 100) throw new BadRequestException('Rate must be 0–100.');
    const config = await this.prisma.platformConfig.findFirst();
    if (config) {
      await this.prisma.platformConfig.update({
        where: { id: config.id },
        data: { commissionRate: new Prisma.Decimal(rate) },
      });
    } else {
      await this.prisma.platformConfig.create({
        data: { commissionRate: new Prisma.Decimal(rate) },
      });
    }
    return { commissionRate: rate };
  }

  async listRefundRequests(req: Request, status?: string) {
    await this.assertAdmin(req);
    const requests = await this.prisma.refundRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        order: { select: { id: true, finalAmount: true } },
      },
    });
    return {
      refundRequests: requests.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        userId: r.userId,
        reason: r.reason,
        amount: Number(r.amount),
        status: r.status,
        note: r.note ?? null,
        processedAt: r.processedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        order: { id: r.order.id, finalAmount: Number(r.order.finalAmount) },
      })),
    };
  }

  async processRefundRequest(req: Request, requestId: number, approved: boolean, note?: string) {
    await this.assertAdmin(req);
    const request = await this.prisma.refundRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Refund request not found.');
    if (request.status !== REFUND_REQUEST_STATUS.PENDING) {
      throw new BadRequestException('Request is already processed.');
    }
    const updated = await this.prisma.refundRequest.update({
      where: { id: requestId },
      data: {
        status: approved ? REFUND_REQUEST_STATUS.APPROVED : REFUND_REQUEST_STATUS.REJECTED,
        note: note?.trim() ?? null,
        processedAt: new Date(),
      },
    });
    return { id: updated.id, status: updated.status };
  }

  async listWithdrawalRequests(req: Request, status?: string) {
    await this.assertAdmin(req);
    const requests = await this.prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: { seller: { select: { id: true, shopName: true } } },
        },
      },
    });
    return {
      withdrawals: requests.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        bankName: w.bankName,
        bankAccount: w.bankAccount,
        bankHolder: w.bankHolder,
        status: w.status,
        note: w.note ?? null,
        processedAt: w.processedAt?.toISOString() ?? null,
        createdAt: w.createdAt.toISOString(),
        seller: w.wallet.seller,
      })),
    };
  }

  async processWithdrawal(req: Request, withdrawalId: number, approved: boolean, note?: string) {
    await this.assertAdmin(req);
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });
    if (!withdrawal) throw new NotFoundException('Withdrawal request not found.');
    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      throw new BadRequestException('Request is already processed.');
    }

    if (!approved) {
      await this.prisma.$transaction(async (tx) => {
        await tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: WITHDRAWAL_STATUS.REJECTED,
            note: note?.trim() ?? null,
            processedAt: new Date(),
          },
        });
        await tx.sellerWallet.update({
          where: { id: withdrawal.walletId },
          data: {
            balance: { increment: withdrawal.amount },
            totalWithdrawn: { decrement: withdrawal.amount },
          },
        });
      });
    } else {
      await this.prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: WITHDRAWAL_STATUS.APPROVED,
          note: note?.trim() ?? null,
          processedAt: new Date(),
        },
      });
    }

    return { id: withdrawalId, status: approved ? WITHDRAWAL_STATUS.APPROVED : WITHDRAWAL_STATUS.REJECTED };
  }

  async getRevenueReport(req: Request) {
    await this.assertAdmin(req);
    const [totalRevenue, totalTransactions, pendingRefunds, pendingWithdrawals] = await Promise.all([
      this.prisma.walletTransaction.aggregate({ _sum: { fee: true } }),
      this.prisma.walletTransaction.count(),
      this.prisma.refundRequest.count({ where: { status: REFUND_REQUEST_STATUS.PENDING } }),
      this.prisma.withdrawalRequest.count({ where: { status: WITHDRAWAL_STATUS.PENDING } }),
    ]);
    return {
      platformRevenue: Number(totalRevenue._sum.fee ?? 0),
      totalTransactions,
      pendingRefunds,
      pendingWithdrawals,
    };
  }

  async setSellerStatus(
    req: Request,
    sellerId: number,
    nextStatus: typeof SELLER_STATUS.ACTIVE | typeof SELLER_STATUS.DISABLED
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
    if (seller.status === SELLER_STATUS.PENDING || seller.status === SELLER_STATUS.REJECTED) {
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

  async listShippers(req: Request, status?: string) {
    await this.assertAdmin(req);

    const shippers = await this.prisma.shipperProfile.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        vehicleType: true,
        status: true,
        rejectReason: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    return { shippers };
  }

  async approveShipper(req: Request, shipperId: number) {
    await this.assertAdmin(req);

    const shipper = await this.prisma.shipperProfile.findUnique({ where: { id: shipperId } });
    if (!shipper) throw new NotFoundException('Shipper profile not found.');
    if (shipper.status !== SHIPPER_STATUS.PENDING) {
      throw new BadRequestException('Shipper is not in PENDING status.');
    }

    const updated = await this.prisma.shipperProfile.update({
      where: { id: shipperId },
      data: { status: SHIPPER_STATUS.ACTIVE },
      include: { user: { select: { id: true, fullName: true, email: true, phone: true } } },
    });

    return { shipper: updated };
  }

  async rejectShipper(req: Request, shipperId: number, reason: string) {
    await this.assertAdmin(req);

    const shipper = await this.prisma.shipperProfile.findUnique({ where: { id: shipperId } });
    if (!shipper) throw new NotFoundException('Shipper profile not found.');
    if (shipper.status !== SHIPPER_STATUS.PENDING) {
      throw new BadRequestException('Shipper is not in PENDING status.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.shipperProfile.update({
        where: { id: shipperId },
        data: { status: SHIPPER_STATUS.REJECTED, rejectReason: reason },
        include: { user: { select: { id: true, fullName: true, email: true, phone: true } } },
      });

      await tx.user.update({
        where: { id: shipper.userId },
        data: { role: USER_ROLE.USER },
      });

      return profile;
    });

    return { shipper: updated };
  }

  async setShipperStatus(req: Request, shipperId: number, status: string) {
    await this.assertAdmin(req);

    const shipper = await this.prisma.shipperProfile.findUnique({ where: { id: shipperId } });
    if (!shipper) throw new NotFoundException('Shipper profile not found.');

    const updated = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.shipperProfile.update({
        where: { id: shipperId },
        data: { status },
        include: { user: { select: { id: true, fullName: true, email: true, phone: true } } },
      });

      await tx.user.update({
        where: { id: shipper.userId },
        data: { role: status === SHIPPER_STATUS.ACTIVE ? USER_ROLE.SHIPPER : USER_ROLE.USER },
      });

      return profile;
    });

    return { shipper: updated };
  }

  async assignShipper(req: Request, shipmentId: number, shipperId: number) {
    await this.assertAdmin(req);

    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found.');

    const shipper = await this.prisma.shipperProfile.findUnique({
      where: { id: shipperId },
      select: { id: true, status: true },
    });
    if (!shipper || shipper.status !== SHIPPER_STATUS.ACTIVE) {
      throw new BadRequestException('Shipper is not active.');
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { shipperId, status: 'ASSIGNED' },
    });

    return { shipmentId: updated.id, shipperId: updated.shipperId, status: updated.status };
  }

  async listReturnRequests(req: Request, status?: string) {
    await this.assertAdmin(req);

    const requests = await this.prisma.returnRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        orderGroup: {
          select: {
            id: true,
            orderId: true,
            seller: { select: { id: true, shopName: true } },
            items: { select: { id: true, productName: true, quantity: true, imageUrlAtTime: true } },
          },
        },
      },
    });

    return {
      returnRequests: requests.map((r) => ({
        id: r.id,
        orderGroupId: r.orderGroupId,
        type: r.type,
        reason: r.reason,
        images: r.images,
        status: r.status,
        note: r.note,
        processedAt: r.processedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        orderGroup: r.orderGroup,
      })),
    };
  }

  async completeReturnRequest(req: Request, returnRequestId: number, note?: string) {
    await this.assertAdmin(req);

    const request = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
    });
    if (!request) throw new NotFoundException('Return request not found.');
    if (request.status !== RETURN_REQUEST_STATUS.ITEM_RECEIVED) {
      throw new BadRequestException('Return request must be ITEM_RECEIVED before completing.');
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: RETURN_REQUEST_STATUS.COMPLETED,
        note: note?.trim() ?? request.note,
        processedAt: new Date(),
      },
    });

    return { id: updated.id, status: updated.status };
  }
}
