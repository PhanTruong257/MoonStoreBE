import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { ensureAdminRole } from '../../common/auth/admin-guard.helper';
import { extractUserIdFromRequest } from '../../common/auth/auth-token.helper';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminOrderDetailResponseDto,
  AdminOrderListResponseDto,
} from './dto/admin-orders.dto';

type OrderListFilters = {
  status?: string;
  paymentStatus?: string;
  sellerId?: number;
  userId?: number;
};

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private async assertAdmin(req: Request): Promise<void> {
    const userId = extractUserIdFromRequest(req, this.jwtService);
    await ensureAdminRole(this.prisma, userId);
  }

  async list(req: Request, filters: OrderListFilters): Promise<AdminOrderListResponseDto> {
    await this.assertAdmin(req);

    const where: Record<string, unknown> = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.sellerId) {
      where.orderGroups = { some: { sellerId: filters.sellerId } };
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        user: { select: { fullName: true } },
        orderGroups: { select: { id: true } },
      },
    });

    return {
      orders: orders.map((order) => ({
        id: order.id,
        userId: order.userId,
        userFullName: order.user.fullName,
        totalAmount: Number(order.totalAmount),
        shippingFee: Number(order.shippingFee),
        discountAmount: Number(order.discountAmount),
        finalAmount: Number(order.finalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        groupCount: order.orderGroups.length,
      })),
    };
  }

  async detail(req: Request, orderId: number): Promise<AdminOrderDetailResponseDto> {
    await this.assertAdmin(req);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
        orderGroups: {
          include: {
            seller: { select: { id: true, shopName: true } },
            items: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return {
      order: {
        id: order.id,
        userId: order.userId,
        userFullName: order.user.fullName,
        userEmail: order.user.email,
        userPhone: order.user.phone,
        voucherId: order.voucherId,
        totalAmount: Number(order.totalAmount),
        shippingFee: Number(order.shippingFee),
        discountAmount: Number(order.discountAmount),
        finalAmount: Number(order.finalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        shippingAddress: order.shippingAddress as Record<string, unknown> | null,
        createdAt: order.createdAt.toISOString(),
        groups: order.orderGroups.map((group) => ({
          id: group.id,
          sellerId: group.sellerId,
          sellerShopName: group.seller.shopName,
          status: group.status,
          subtotal: Number(group.subtotal),
          shippingFee: Number(group.shippingFee),
          items: group.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPriceAtTime: Number(item.unitPriceAtTime),
            imageUrl: item.imageUrlAtTime,
          })),
        })),
      },
    };
  }
}
