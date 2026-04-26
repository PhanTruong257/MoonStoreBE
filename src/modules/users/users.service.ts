import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { extractUserIdFromRequest } from '../../common/auth/auth-token.helper';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  UserProfileResponseDto,
  UsersModuleDetailResponseDto,
  UsersModuleListResponseDto,
} from './dto/users-response.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserIdFromRequest(req, this.jwtService);
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
}
