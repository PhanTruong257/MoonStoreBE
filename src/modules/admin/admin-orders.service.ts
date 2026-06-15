import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { assertAdminFromRequest } from '../../common/auth/request-user.helper';
import { ORDER_GROUP_STATUS } from '../../common/constants';
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

const STATUS_PRIORITY = [
  ORDER_GROUP_STATUS.DELIVERED,
  ORDER_GROUP_STATUS.SHIPPING,
  ORDER_GROUP_STATUS.CONFIRMED,
  ORDER_GROUP_STATUS.CANCELLED,
  ORDER_GROUP_STATUS.PENDING,
];

function deriveEffectiveStatus(groupStatuses: string[]): string {
  if (!groupStatuses.length) return ORDER_GROUP_STATUS.PENDING;
  for (const s of STATUS_PRIORITY) {
    if (groupStatuses.includes(s)) return s;
  }
  return groupStatuses[0];
}

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private async assertAdmin(req: Request): Promise<void> {
    await assertAdminFromRequest(req, this.jwtService, this.prisma);
  }

  async list(req: Request, filters: OrderListFilters): Promise<AdminOrderListResponseDto> {
    await this.assertAdmin(req);

    const groupFilter: Record<string, unknown> = {};
    if (filters.status) {
      groupFilter.status = filters.status;
    }
    if (filters.sellerId) {
      groupFilter.sellerId = filters.sellerId;
    }

    const where: Record<string, unknown> = {};
    if (Object.keys(groupFilter).length) {
      where.orderGroups = { some: groupFilter };
    }
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        user: { select: { fullName: true } },
        orderGroups: { select: { id: true, status: true } },
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
        status: deriveEffectiveStatus(order.orderGroups.map((g) => g.status)),
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
