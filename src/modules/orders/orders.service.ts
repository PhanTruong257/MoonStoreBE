import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

import {
  getActiveSellerIdForUser,
  getUserIdFromRequest as extractUserId,
} from '../../common/auth/request-user.helper';
import {
  ORDER_GROUP_STATUS,
  ORDER_GROUP_STATUS_FLOW,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { VouchersService } from '../vouchers/vouchers.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderGroupStatusDto } from './dto/update-order-group-status.dto';
import type {
  OrderCreateResponseDto,
  OrderDetailResponseDto,
  OrderGroupStatusResponseDto,
  OrderListResponseDto,
} from './dto/orders-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly vouchersService: VouchersService
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserId(req, this.jwtService);
  }

  private getSellerIdForUser(userId: number) {
    return getActiveSellerIdForUser(this.prisma, userId);
  }

  async createOrder(req: Request, payload: CreateOrderDto): Promise<OrderCreateResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const cart = await this.prisma.cart.findFirst({ where: { userId } });

    if (!cart) {
      throw new BadRequestException('Cart not found.');
    }

    const cartItems = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sellerId: true,
            basePrice: true,
            stock: true,
            imageUrl: true,
          },
        },
        selectedOptions: {
          include: {
            option: {
              select: {
                id: true,
                name: true,
                priceDelta: true,
                group: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    cartItems.forEach((item) => {
      if (item.quantity > item.product.stock) {
        throw new BadRequestException(
          `Product ${item.product.name} is out of stock for requested quantity.`
        );
      }
    });

    const enrichedItems = cartItems.map((item) => {
      const basePrice = Number(item.product.basePrice);
      const optionsTotal = item.selectedOptions.reduce(
        (sum, entry) => sum + Number(entry.option.priceDelta),
        0
      );
      const unitPrice = basePrice + optionsTotal;

      return {
        cartItem: item,
        basePrice,
        optionsTotal,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const shippingFee = Number(payload.shippingFee ?? 0);
    const paymentMethod = payload.paymentMethod?.trim() || PAYMENT_METHOD.COD;
    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    let resolvedShippingAddress: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
    if (payload.addressId) {
      const saved = await this.prisma.userAddress.findUnique({
        where: { id: payload.addressId },
      });
      if (!saved || saved.userId !== userId) {
        throw new BadRequestException('Address not found.');
      }
      resolvedShippingAddress = {
        addressLine: saved.addressLine,
        city: saved.city,
        district: saved.district,
        addressId: saved.id,
      };
    } else if (payload.shippingAddress) {
      resolvedShippingAddress = payload.shippingAddress as Prisma.InputJsonValue;
    }

    let voucherId: number | null = null;
    let discountAmount = 0;
    if (payload.voucherCode?.trim()) {
      const validation = await this.vouchersService.validateVoucher({
        code: payload.voucherCode.trim(),
        subtotal: totalAmount,
      });
      if (!validation.isValid || !validation.voucher) {
        throw new BadRequestException(validation.reason ?? 'Invalid voucher.');
      }
      voucherId = validation.voucher.id;
      discountAmount = validation.discountAmount;
    }

    const finalAmount = Math.max(0, totalAmount + shippingFee - discountAmount);

    const grouped = enrichedItems.reduce(
      (acc, item) => {
        const sellerId = item.cartItem.product.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      },
      {} as Record<number, typeof enrichedItems>
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          voucherId,
          totalAmount: new Prisma.Decimal(totalAmount),
          shippingFee: new Prisma.Decimal(shippingFee),
          discountAmount: new Prisma.Decimal(discountAmount),
          finalAmount: new Prisma.Decimal(finalAmount),
          paymentMethod,
          paymentStatus: PAYMENT_STATUS.PENDING,
          status: ORDER_GROUP_STATUS.PENDING,
          shippingAddress: resolvedShippingAddress,
        },
        select: { id: true },
      });

      for (const [sellerKey, sellerItems] of Object.entries(grouped)) {
        const sellerId = Number(sellerKey);
        const subtotal = sellerItems.reduce((sum, entry) => sum + entry.lineTotal, 0);

        const group = await tx.orderGroup.create({
          data: {
            orderId: createdOrder.id,
            sellerId,
            status: ORDER_GROUP_STATUS.PENDING,
            subtotal: new Prisma.Decimal(subtotal),
            shippingFee: new Prisma.Decimal(0),
          },
          select: { id: true },
        });

        for (const entry of sellerItems) {
          await tx.orderItem.create({
            data: {
              orderGroupId: group.id,
              productId: entry.cartItem.product.id,
              productName: entry.cartItem.product.name,
              basePriceAtTime: new Prisma.Decimal(entry.basePrice),
              optionsTotalAtTime: new Prisma.Decimal(entry.optionsTotal),
              unitPriceAtTime: new Prisma.Decimal(entry.unitPrice),
              imageUrlAtTime: entry.cartItem.product.imageUrl,
              quantity: entry.cartItem.quantity,
              selectedOptions: {
                create: entry.cartItem.selectedOptions.map((selected) => ({
                  optionId: selected.option.id,
                  groupName: selected.option.group.name,
                  optionName: selected.option.name,
                  priceDelta: new Prisma.Decimal(Number(selected.option.priceDelta)),
                })),
              },
            },
          });
        }

        await tx.orderStatusLog.create({
          data: {
            orderGroupId: group.id,
            status: ORDER_GROUP_STATUS.PENDING,
            note: 'Order created',
          },
        });
      }

      await Promise.all(
        enrichedItems.map((entry) =>
          tx.product.update({
            where: { id: entry.cartItem.product.id },
            data: { stock: { decrement: entry.cartItem.quantity } },
          })
        )
      );

      if (voucherId !== null) {
        await tx.voucherUsage.create({
          data: {
            voucherId,
            userId,
            orderId: createdOrder.id,
          },
        });
      }

      await tx.cartItemOption.deleteMany({
        where: { cartItem: { cartId: cart.id } },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    return { orderId: order.id };
  }

  async findOrders(req: Request): Promise<OrderListResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { orderGroups: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      orders: orders.map((order) => ({
        id: order.id,
        userId: order.userId,
        voucherId: order.voucherId ?? null,
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
          status: group.status,
          subtotal: Number(group.subtotal),
          shippingFee: Number(group.shippingFee),
        })),
      })),
    };
  }

  async getOrderDetail(req: Request, orderId: number): Promise<OrderDetailResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderGroups: {
          include: {
            items: {
              include: {
                selectedOptions: true,
              },
            },
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new ForbiddenException('Order not found.');
    }

    return {
      order: {
        id: order.id,
        userId: order.userId,
        voucherId: order.voucherId ?? null,
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
          status: group.status,
          subtotal: Number(group.subtotal),
          shippingFee: Number(group.shippingFee),
          items: group.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            basePriceAtTime: Number(item.basePriceAtTime),
            optionsTotalAtTime: Number(item.optionsTotalAtTime),
            unitPriceAtTime: Number(item.unitPriceAtTime),
            imageUrlAtTime: item.imageUrlAtTime,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions.map((opt) => ({
              groupName: opt.groupName,
              optionName: opt.optionName,
              priceDelta: Number(opt.priceDelta),
            })),
          })),
        })),
      },
    };
  }

  async updateGroupStatus(
    req: Request,
    groupId: number,
    payload: UpdateOrderGroupStatusDto
  ): Promise<OrderGroupStatusResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);
    const nextStatus = payload.status?.trim().toUpperCase();

    const isFlowStatus = (ORDER_GROUP_STATUS_FLOW as string[]).includes(
      nextStatus ?? '',
    );
    if (
      !nextStatus ||
      (!isFlowStatus && nextStatus !== ORDER_GROUP_STATUS.CANCELLED)
    ) {
      throw new BadRequestException('Invalid status.');
    }

    const group = await this.prisma.orderGroup.findUnique({
      where: { id: groupId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!group || group.sellerId !== sellerId) {
      throw new ForbiddenException('Order group not found.');
    }

    if (
      group.status === ORDER_GROUP_STATUS.CANCELLED ||
      group.status === ORDER_GROUP_STATUS.DELIVERED
    ) {
      throw new BadRequestException('Order group cannot be updated.');
    }

    if (nextStatus !== ORDER_GROUP_STATUS.CANCELLED) {
      const flow = ORDER_GROUP_STATUS_FLOW as string[];
      const currentIndex = flow.indexOf(group.status);
      const nextIndex = flow.indexOf(nextStatus);
      if (nextIndex !== currentIndex + 1) {
        throw new BadRequestException('Invalid status transition.');
      }
    }

    const updated = await this.prisma.orderGroup.update({
      where: { id: groupId },
      data: { status: nextStatus },
      select: { id: true, status: true },
    });

    await this.prisma.orderStatusLog.create({
      data: {
        orderGroupId: groupId,
        status: nextStatus,
        note: payload.note?.trim() ?? null,
      },
    });

    return { groupId: updated.id, status: updated.status };
  }

  async cancelGroup(req: Request, groupId: number): Promise<OrderGroupStatusResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const group = await this.prisma.orderGroup.findUnique({
      where: { id: groupId },
      include: { order: { select: { userId: true } } },
    });

    if (!group || group.order.userId !== userId) {
      throw new ForbiddenException('Order group not found.');
    }

    if (group.status !== ORDER_GROUP_STATUS.PENDING) {
      throw new BadRequestException('Order group cannot be cancelled.');
    }

    const updated = await this.prisma.orderGroup.update({
      where: { id: groupId },
      data: { status: ORDER_GROUP_STATUS.CANCELLED },
      select: { id: true, status: true },
    });

    await this.prisma.orderStatusLog.create({
      data: {
        orderGroupId: groupId,
        status: ORDER_GROUP_STATUS.CANCELLED,
        note: 'Cancelled by buyer',
      },
    });

    return { groupId: updated.id, status: updated.status };
  }
}
