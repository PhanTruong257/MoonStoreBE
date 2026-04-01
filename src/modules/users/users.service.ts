import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const ACCESS_COOKIE_NAME = 'access_token';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private getAccessSecret() {
    return process.env.JWT_SECRET ?? 'dev-secret';
  }

  private getUserIdFromRequest(req: Request) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[ACCESS_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    try {
      const payload = this.jwtService.verify<{ sub: number }>(token, {
        secret: this.getAccessSecret(),
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }

  findAll() {
    return {
      module: 'users',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'users',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }

  async getProfile(req: Request) {
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

  async updateProfile(req: Request, payload: UpdateProfileDto) {
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

    return {
      user,
      address: updatedAddress,
    };
  }
}
