import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { getUserIdFromRequest as extractUserId } from '../../common/auth/request-user.helper';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  UserProfileResponseDto,
  UsersModuleDetailResponseDto,
  UsersModuleListResponseDto,
} from './dto/users-response.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type {
  CreateAddressDto,
  UpdateAddressDto,
  UserAddressListResponseDto,
  UserAddressResponseDto,
} from './dto/address.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserId(req, this.jwtService);
  }

  findAll(): UsersModuleListResponseDto {
    return {
      module: 'users',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): UsersModuleDetailResponseDto {
    return {
      module: 'users',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }

  async getProfile(req: Request): Promise<UserProfileResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const address = await this.prisma.userAddress.findFirst({
      where: { userId, isDefault: true },
      select: { addressLine: true },
    });

    return {
      user,
      address: address?.addressLine ?? null,
    };
  }

  async updateProfile(req: Request, payload: UpdateProfileDto): Promise<UserProfileResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const fullName = payload.fullName?.trim();
    const email = payload.email?.trim().toLowerCase();
    const phone = payload.phone?.trim();
    const address = payload.address?.trim();

    if (!fullName && !email && !phone && !address) {
      throw new BadRequestException('No data to update.');
    }

    if (email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
        select: { id: true },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists.');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
      },
    });

    let updatedAddress = null as string | null;
    if (address) {
      const existingAddress = await this.prisma.userAddress.findFirst({
        where: { userId, isDefault: true },
        select: { id: true },
      });

      if (existingAddress) {
        const nextAddress = await this.prisma.userAddress.update({
          where: { id: existingAddress.id },
          data: { addressLine: address },
          select: { addressLine: true },
        });
        updatedAddress = nextAddress.addressLine;
      } else {
        const nextAddress = await this.prisma.userAddress.create({
          data: {
            userId,
            addressLine: address,
            city: '',
            district: '',
            isDefault: true,
          },
          select: { addressLine: true },
        });
        updatedAddress = nextAddress.addressLine;
      }
    }

    if (!address) {
      const existingAddress = await this.prisma.userAddress.findFirst({
        where: { userId, isDefault: true },
        select: { addressLine: true },
      });
      updatedAddress = existingAddress?.addressLine ?? null;
    }

    return { user, address: updatedAddress };
  }

  async listAddresses(req: Request): Promise<UserAddressListResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });

    return { addresses };
  }

  async createAddress(req: Request, payload: CreateAddressDto): Promise<UserAddressResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const addressLine = payload.addressLine?.trim();
    const city = payload.city?.trim();
    const district = payload.district?.trim();
    if (!addressLine || !city || !district) {
      throw new BadRequestException('addressLine, city and district are required.');
    }

    const wantDefault = payload.isDefault ?? false;
    const existingCount = await this.prisma.userAddress.count({
      where: { userId },
    });
    const shouldBeDefault = wantDefault || existingCount === 0;

    const address = await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.create({
        data: {
          userId,
          addressLine,
          city,
          district,
          isDefault: shouldBeDefault,
        },
      });
    });

    return { address };
  }

  async updateAddress(
    req: Request,
    addressId: number,
    payload: UpdateAddressDto
  ): Promise<UserAddressResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const existing = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found.');
    }

    const addressLine = payload.addressLine?.trim();
    const city = payload.city?.trim();
    const district = payload.district?.trim();

    const address = await this.prisma.$transaction(async (tx) => {
      if (payload.isDefault === true) {
        await tx.userAddress.updateMany({
          where: { userId, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.update({
        where: { id: addressId },
        data: {
          ...(addressLine !== undefined ? { addressLine } : {}),
          ...(city !== undefined ? { city } : {}),
          ...(district !== undefined ? { district } : {}),
          ...(payload.isDefault !== undefined ? { isDefault: payload.isDefault } : {}),
        },
      });
    });

    return { address };
  }

  async deleteAddress(req: Request, addressId: number): Promise<{ id: number }> {
    const userId = this.getUserIdFromRequest(req);

    const existing = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({ where: { id: addressId } });

      if (existing.isDefault) {
        const next = await tx.userAddress.findFirst({
          where: { userId },
          orderBy: { id: 'desc' },
        });
        if (next) {
          await tx.userAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { id: addressId };
  }

  async setDefaultAddress(req: Request, addressId: number): Promise<UserAddressResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const existing = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found.');
    }

    const address = await this.prisma.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
      return tx.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return { address };
  }

  async getAddressForUser(userId: number, addressId: number) {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      return null;
    }
    return address;
  }
}
