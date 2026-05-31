import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import {
  getActiveShipperIdForUser,
  getUserIdFromRequest as extractUserId,
} from '../../common/auth/request-user.helper';
import {
  SHIPMENT_STATUS,
  SHIPMENT_STATUS_FLOW,
  SHIPPER_STATUS,
  USER_ROLE,
} from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateShipperDto } from './dto/create-shipper.dto';
import type {
  ShipperApplyResponseDto,
  ShipperProfileResponseDto,
  ShipperShipmentsResponseDto,
  UpdateShipmentStatusResponseDto,
} from './dto/shipper-response.dto';
import type { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

@Injectable()
export class ShipperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserId(req, this.jwtService);
  }

  private getShipperIdForUser(userId: number) {
    return getActiveShipperIdForUser(this.prisma, userId);
  }

  async applyShipper(req: Request, payload: CreateShipperDto): Promise<ShipperApplyResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const existing = await this.prisma.shipperProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('You have already applied to be a shipper.');
    }

    const profile = await this.prisma.$transaction(async (tx) => {
      const newProfile = await tx.shipperProfile.create({
        data: {
          userId,
          vehicleType: payload.vehicleType,
          status: SHIPPER_STATUS.PENDING,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: USER_ROLE.SHIPPER },
      });

      return newProfile;
    });

    return {
      id: profile.id,
      userId: profile.userId,
      vehicleType: profile.vehicleType,
      status: profile.status,
      createdAt: profile.createdAt.toISOString(),
    };
  }

  async getMyProfile(req: Request): Promise<ShipperProfileResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const profile = await this.prisma.shipperProfile.findUnique({
      where: { userId },
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

    if (!profile) {
      throw new NotFoundException('Shipper profile not found.');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      vehicleType: profile.vehicleType,
      status: profile.status,
      rejectReason: profile.rejectReason,
      createdAt: profile.createdAt.toISOString(),
      user: profile.user,
    };
  }

  async getMyShipments(req: Request): Promise<ShipperShipmentsResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const shipperId = await this.getShipperIdForUser(userId);

    const shipments = await this.prisma.shipment.findMany({
      where: { shipperId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderGroupId: true,
        carrier: true,
        trackingCode: true,
        status: true,
        createdAt: true,
        orderGroup: {
          select: {
            id: true,
            status: true,
            order: { select: { id: true, shippingAddress: true } },
          },
        },
      },
    });

    return {
      shipments: shipments.map((s) => ({
        id: s.id,
        orderGroupId: s.orderGroupId,
        carrier: s.carrier,
        trackingCode: s.trackingCode,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        orderGroup: s.orderGroup,
      })),
    };
  }

  async updateShipmentStatus(
    req: Request,
    shipmentId: number,
    payload: UpdateShipmentStatusDto
  ): Promise<UpdateShipmentStatusResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const shipperId = await this.getShipperIdForUser(userId);

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { id: true, shipperId: true, status: true, orderGroupId: true },
    });

    if (!shipment || shipment.shipperId !== shipperId) {
      throw new ForbiddenException('Shipment not found or not assigned to you.');
    }

    const currentIndex = SHIPMENT_STATUS_FLOW.indexOf(
      shipment.status as (typeof SHIPMENT_STATUS_FLOW)[number]
    );
    const nextIndex = SHIPMENT_STATUS_FLOW.indexOf(
      payload.status as (typeof SHIPMENT_STATUS_FLOW)[number]
    );

    const isFailedTransition = payload.status === SHIPMENT_STATUS.FAILED;

    if (!isFailedTransition && (nextIndex === -1 || nextIndex !== currentIndex + 1)) {
      throw new BadRequestException('Invalid status transition.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: { status: payload.status },
      });

      await tx.shipmentLog.create({
        data: {
          shipmentId,
          status: payload.status,
          location: payload.location ?? '',
          timestamp: new Date(),
        },
      });

      if (payload.status === SHIPMENT_STATUS.DELIVERED) {
        await tx.orderGroup.update({
          where: { id: shipment.orderGroupId },
          data: { status: 'DELIVERED' },
        });
      }

      return updatedShipment;
    });

    return { id: updated.id, status: updated.status };
  }
}
