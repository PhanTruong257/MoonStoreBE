import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

import {
  getActiveSellerIdForUser,
  getUserIdFromRequest as extractUserId,
} from '../../common/auth/request-user.helper';
import {
  ORDER_GROUP_STATUS,
  PRODUCT_STATUS,
  SELLER_STATUS,
} from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateProductResponseDto,
  CreateSellerResponseDto,
  SellerProductOptionGroupDto,
  SellerProfileMeResponseDto,
  SellersModuleDetailResponseDto,
  SellersModuleListResponseDto,
} from './dto/sellers-response.dto';
import type { CreateProductDto, CreateProductOptionGroupDto } from './dto/create-product.dto';
import type { CreateSellerDto } from './dto/create-seller.dto';
import type { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import type { UpdateSellerProductDto } from './dto/update-product.dto';
import type {
  SellerOrderDetailResponseDto,
  SellerOrderListResponseDto,
  SellerProductListResponseDto,
  SellerStatsResponseDto,
} from './dto/seller-orders-response.dto';

type ProductWithOptionGroups = Prisma.ProductGetPayload<{
  include: {
    optionGroups: {
      include: { options: true };
    };
  };
}>;

@Injectable()
export class SellersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserId(req, this.jwtService);
  }

  private getSellerIdForUser(userId: number) {
    return getActiveSellerIdForUser(this.prisma, userId);
  }

  private mapOptionGroups(product: ProductWithOptionGroups): SellerProductOptionGroupDto[] {
    const sortedGroups = [...product.optionGroups].sort((a, b) => a.position - b.position);
    return sortedGroups.map((group) => ({
      id: group.id,
      name: group.name,
      position: group.position,
      required: group.required,
      multiSelect: group.multiSelect,
      options: [...group.options]
        .sort((a, b) => a.position - b.position)
        .map((option) => ({
          id: option.id,
          name: option.name,
          priceDelta: Number(option.priceDelta),
          position: option.position,
        })),
    }));
  }

  private toProductResponse(product: ProductWithOptionGroups): CreateProductResponseDto {
    return {
      product: {
        id: product.id,
        sellerId: product.sellerId,
        name: product.name,
        description: product.description,
        status: product.status,
        categoryId: product.categoryId,
        brandId: product.brandId,
        basePrice: Number(product.basePrice),
        stock: product.stock,
        imageUrl: product.imageUrl,
        optionGroups: this.mapOptionGroups(product),
      },
    };
  }

  private async replaceOptionGroups(
    tx: Prisma.TransactionClient,
    productId: number,
    groups: CreateProductOptionGroupDto[]
  ) {
    await tx.option.deleteMany({ where: { group: { productId } } });
    await tx.optionGroup.deleteMany({ where: { productId } });

    let groupPosition = 0;
    for (const group of groups) {
      const created = await tx.optionGroup.create({
        data: {
          productId,
          name: group.name.trim(),
          position: groupPosition,
          required: group.required ?? true,
          multiSelect: group.multiSelect ?? false,
        },
      });
      groupPosition += 1;

      let optionPosition = 0;
      for (const option of group.options ?? []) {
        await tx.option.create({
          data: {
            groupId: created.id,
            name: option.name.trim(),
            priceDelta: new Prisma.Decimal(option.priceDelta ?? 0),
            position: optionPosition,
          },
        });
        optionPosition += 1;
      }
    }
  }

  findAll(): SellersModuleListResponseDto {
    return {
      module: 'sellers',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): SellersModuleDetailResponseDto {
    return {
      module: 'sellers',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }

  async createSellerProfile(
    req: Request,
    payload: CreateSellerDto
  ): Promise<CreateSellerResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    if (!payload.shopName?.trim()) {
      throw new BadRequestException('Shop name is required.');
    }

    const existing = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (existing && existing.status !== SELLER_STATUS.REJECTED) {
      throw new ConflictException(
        'Seller application already exists. Please wait for admin review.'
      );
    }

    const data = {
      shopName: payload.shopName.trim(),
      description: payload.description?.trim() ?? null,
      status: SELLER_STATUS.PENDING,
      rejectReason: null,
    };

    const seller = existing
      ? await this.prisma.seller.update({
          where: { id: existing.id },
          data,
          select: {
            id: true,
            userId: true,
            shopName: true,
            description: true,
            status: true,
            rejectReason: true,
          },
        })
      : await this.prisma.seller.create({
          data: { userId, ...data },
          select: {
            id: true,
            userId: true,
            shopName: true,
            description: true,
            status: true,
            rejectReason: true,
          },
        });

    return { seller };
  }

  async getMyProfile(req: Request): Promise<SellerProfileMeResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        shopName: true,
        description: true,
        status: true,
        rejectReason: true,
      },
    });

    return { seller };
  }

  async updateMyProfile(
    req: Request,
    payload: UpdateSellerProfileDto
  ): Promise<SellerProfileMeResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const existing = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Seller profile not found.');
    }

    if (existing.status === SELLER_STATUS.PENDING) {
      throw new BadRequestException(
        'Application is being reviewed and cannot be edited.',
      );
    }

    const data: Prisma.SellerUpdateInput = {};
    if (payload.shopName !== undefined) {
      const trimmed = payload.shopName.trim();
      if (!trimmed) {
        throw new BadRequestException('Shop name cannot be empty.');
      }
      data.shopName = trimmed;
    }
    if (payload.description !== undefined) {
      data.description = payload.description?.trim() ?? null;
    }

    if (existing.status === SELLER_STATUS.REJECTED) {
      data.status = SELLER_STATUS.PENDING;
      data.rejectReason = null;
    }

    const seller = await this.prisma.seller.update({
      where: { id: existing.id },
      data,
      select: {
        id: true,
        userId: true,
        shopName: true,
        description: true,
        status: true,
        rejectReason: true,
      },
    });

    return { seller };
  }

  async createProduct(req: Request, payload: CreateProductDto): Promise<CreateProductResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);
    const seller = { id: sellerId };

    const category = await this.prisma.category.findUnique({
      where: { id: payload.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Category not found.');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: payload.brandId },
      select: { id: true },
    });
    if (!brand) {
      throw new BadRequestException('Brand not found.');
    }

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sellerId: seller.id,
          name: payload.name.trim(),
          description: payload.description?.trim() ?? null,
          categoryId: payload.categoryId,
          brandId: payload.brandId,
          basePrice: new Prisma.Decimal(payload.basePrice),
          stock: payload.stock,
          imageUrl: payload.imageUrl.trim(),
          status: payload.status?.trim() ?? PRODUCT_STATUS.ACTIVE,
        },
      });

      if (payload.optionGroups && payload.optionGroups.length > 0) {
        await this.replaceOptionGroups(tx, created.id, payload.optionGroups);
      }

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          optionGroups: { include: { options: true } },
        },
      });
    });

    return this.toProductResponse(product);
  }

  async getSellerProductDetail(req: Request, productId: number): Promise<CreateProductResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        optionGroups: { include: { options: true } },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('Not your product.');
    }

    return this.toProductResponse(product);
  }

  async updateSellerProduct(
    req: Request,
    productId: number,
    payload: UpdateSellerProductDto
  ): Promise<CreateProductResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true },
    });
    if (!existing) {
      throw new NotFoundException('Product not found.');
    }
    if (existing.sellerId !== sellerId) {
      throw new ForbiddenException('Not your product.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.ProductUpdateInput = {};
      if (payload.name !== undefined) {
        data.name = payload.name.trim();
      }
      if (payload.description !== undefined) {
        data.description = payload.description?.trim() ?? null;
      }
      if (payload.status !== undefined) {
        data.status = payload.status.trim();
      }
      if (payload.categoryId !== undefined) {
        data.category = { connect: { id: payload.categoryId } };
      }
      if (payload.brandId !== undefined) {
        data.brand = { connect: { id: payload.brandId } };
      }
      if (payload.basePrice !== undefined) {
        data.basePrice = new Prisma.Decimal(payload.basePrice);
      }
      if (payload.stock !== undefined) {
        data.stock = payload.stock;
      }
      if (payload.imageUrl !== undefined) {
        data.imageUrl = payload.imageUrl.trim();
      }

      await tx.product.update({ where: { id: productId }, data });

      if (payload.optionGroups !== undefined) {
        await this.replaceOptionGroups(tx, productId, payload.optionGroups);
      }

      return tx.product.findUniqueOrThrow({
        where: { id: productId },
        include: { optionGroups: { include: { options: true } } },
      });
    });

    return this.toProductResponse(updated);
  }

  async deleteSellerProduct(
    req: Request,
    productId: number
  ): Promise<{ id: number; status: string }> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('Not your product.');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: PRODUCT_STATUS.DELETED },
      select: { id: true, status: true },
    });

    return updated;
  }

  async findSellerProducts(req: Request): Promise<SellerProductListResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    const products = await this.prisma.product.findMany({
      where: { sellerId },
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        categoryId: true,
        brandId: true,
        basePrice: true,
        stock: true,
        imageUrl: true,
      },
    });

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        status: product.status,
        categoryId: product.categoryId,
        brandId: product.brandId,
        basePrice: Number(product.basePrice),
        stock: product.stock,
        imageUrl: product.imageUrl,
      })),
    };
  }

  async findSellerOrders(req: Request): Promise<SellerOrderListResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    const groups = await this.prisma.orderGroup.findMany({
      where: { sellerId },
      orderBy: { id: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            user: { select: { id: true, fullName: true, phone: true } },
          },
        },
        items: { include: { selectedOptions: true } },
      },
    });

    return {
      groups: groups.map((group) => ({
        id: group.id,
        orderId: group.order.id,
        status: group.status,
        subtotal: Number(group.subtotal),
        shippingFee: Number(group.shippingFee),
        createdAt: group.order.createdAt.toISOString(),
        buyer: {
          id: group.order.user.id,
          fullName: group.order.user.fullName,
          phone: group.order.user.phone,
        },
        items: group.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          basePriceAtTime: Number(item.basePriceAtTime),
          optionsTotalAtTime: Number(item.optionsTotalAtTime),
          unitPriceAtTime: Number(item.unitPriceAtTime),
          imageUrl: item.imageUrlAtTime,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions.map((opt) => ({
            groupName: opt.groupName,
            optionName: opt.optionName,
            priceDelta: Number(opt.priceDelta),
          })),
        })),
      })),
    };
  }

  async getSellerOrderDetail(req: Request, groupId: number): Promise<SellerOrderDetailResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    const group = await this.prisma.orderGroup.findUnique({
      where: { id: groupId },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            shippingAddress: true,
            user: { select: { id: true, fullName: true, phone: true } },
          },
        },
        items: { include: { selectedOptions: true } },
        statusLogs: { orderBy: { id: 'asc' } },
      },
    });

    if (!group) {
      throw new NotFoundException('Order group not found.');
    }
    if (group.sellerId !== sellerId) {
      throw new ForbiddenException('Not your order.');
    }

    return {
      group: {
        id: group.id,
        orderId: group.order.id,
        status: group.status,
        subtotal: Number(group.subtotal),
        shippingFee: Number(group.shippingFee),
        createdAt: group.order.createdAt.toISOString(),
        buyer: {
          id: group.order.user.id,
          fullName: group.order.user.fullName,
          phone: group.order.user.phone,
        },
        items: group.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          basePriceAtTime: Number(item.basePriceAtTime),
          optionsTotalAtTime: Number(item.optionsTotalAtTime),
          unitPriceAtTime: Number(item.unitPriceAtTime),
          imageUrl: item.imageUrlAtTime,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions.map((opt) => ({
            groupName: opt.groupName,
            optionName: opt.optionName,
            priceDelta: Number(opt.priceDelta),
          })),
        })),
        shippingAddress: group.order.shippingAddress as Record<string, unknown> | null,
        statusLogs: group.statusLogs.map((log) => ({
          id: log.id,
          status: log.status,
          note: log.note,
          createdAt: log.createdAt.toISOString(),
        })),
      },
    };
  }

  async getSellerStats(req: Request): Promise<SellerStatsResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    const [totalProducts, activeProducts, groups] = await Promise.all([
      this.prisma.product.count({ where: { sellerId } }),
      this.prisma.product.count({
        where: { sellerId, status: PRODUCT_STATUS.ACTIVE },
      }),
      this.prisma.orderGroup.findMany({
        where: { sellerId },
        select: { status: true, subtotal: true },
      }),
    ]);

    const totalOrders = groups.length;
    const pendingOrders = groups.filter(
      (g) => g.status === ORDER_GROUP_STATUS.PENDING,
    ).length;
    const deliveredOrders = groups.filter(
      (g) => g.status === ORDER_GROUP_STATUS.DELIVERED,
    ).length;
    const revenue = groups
      .filter((g) => g.status === ORDER_GROUP_STATUS.DELIVERED)
      .reduce((sum, g) => sum + Number(g.subtotal), 0);

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      revenue,
    };
  }
}
