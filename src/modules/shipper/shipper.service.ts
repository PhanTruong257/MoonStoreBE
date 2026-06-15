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
  ORDER_GROUP_STATUS,
  SHIPMENT_STATUS,
  SHIPMENT_STATUS_FLOW,
  SHIPPER_STATUS,
} from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

/** Shipment states from which marking a delivery FAILED is meaningful. */
const SHIPMENT_FAILABLE_STATUSES: string[] = [
  SHIPMENT_STATUS.ASSIGNED,
  SHIPMENT_STATUS.PICKED_UP,
  SHIPMENT_STATUS.IN_TRANSIT,
];
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
    private readonly jwtService: JwtService,
    private readonly walletService: WalletService
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

    // Keep the user as a normal buyer until an admin approves the application —
    // the role only flips to shipper on approval (mirrors the seller flow).
    const profile = await this.prisma.shipperProfile.create({
      data: {
        userId,
        vehicleType: 'motorbike',
        status: SHIPPER_STATUS.PENDING,
      },
    });

    return {
      id: profile.id,
      userId: profile.userId,
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
      select: {
        id: true,
        shipperId: true,
        status: true,
        orderGroupId: true,
        orderGroup: { select: { sellerId: true, subtotal: true } },
      },
    });

    if (!shipment || shipment.shipperId !== shipperId) {
      throw new ForbiddenException('Shipment not found or not assigned to you.');
    }

    if (
      shipment.status === SHIPMENT_STATUS.DELIVERED ||
      shipment.status === SHIPMENT_STATUS.FAILED
    ) {
      throw new BadRequestException('Shipment is already in a final state.');
    }

    const isFailedTransition = payload.status === SHIPMENT_STATUS.FAILED;

    if (isFailedTransition) {
      if (!SHIPMENT_FAILABLE_STATUSES.includes(shipment.status)) {
        throw new BadRequestException('Cannot mark this shipment as failed.');
      }
    } else {
      const currentIndex = SHIPMENT_STATUS_FLOW.indexOf(
        shipment.status as (typeof SHIPMENT_STATUS_FLOW)[number]
      );
      const nextIndex = SHIPMENT_STATUS_FLOW.indexOf(
        payload.status as (typeof SHIPMENT_STATUS_FLOW)[number]
      );
      if (nextIndex === -1 || nextIndex !== currentIndex + 1) {
        throw new BadRequestException('Invalid status transition.');
      }
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

      // Keep the order group status in sync with the live shipment progress so
      // the buyer sees SHIPPING while the parcel is in transit, not a stale CONFIRMED.
      if (
        payload.status === SHIPMENT_STATUS.PICKED_UP ||
        payload.status === SHIPMENT_STATUS.IN_TRANSIT
      ) {
        await tx.orderGroup.update({
          where: { id: shipment.orderGroupId },
          data: { status: ORDER_GROUP_STATUS.SHIPPING },
        });
      }

      if (payload.status === SHIPMENT_STATUS.DELIVERED) {
        await tx.orderGroup.update({
          where: { id: shipment.orderGroupId },
          data: { status: ORDER_GROUP_STATUS.DELIVERED },
        });

        await tx.orderStatusLog.create({
          data: {
            orderGroupId: shipment.orderGroupId,
            status: ORDER_GROUP_STATUS.DELIVERED,
            note: 'Delivered by shipper',
          },
        });

        // Credit the seller wallet only now, when delivery is actually confirmed.
        const config = await tx.platformConfig.findFirst();
        const commissionRate = config ? Number(config.commissionRate) : 10;
        await this.walletService.creditSellerWallet(
          shipment.orderGroup.sellerId,
          shipment.orderGroupId,
          Number(shipment.orderGroup.subtotal),
          commissionRate,
          tx
        );
      }

      return updatedShipment;
    });

    return { id: updated.id, status: updated.status };
  }
}
