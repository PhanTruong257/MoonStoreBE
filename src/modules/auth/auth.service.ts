import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import * as bcrypt from 'bcryptjs';

import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAccessSecret,
  getRefreshSecret,
} from '../../common/auth/auth-token.helper';
import { USER_ROLE, USER_STATUS } from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuthLogoutResponseDto,
  AuthUserDto,
  AuthUserResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private getCookieOptions(maxAgeMs: number) {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_COOKIE_NAME, accessToken, this.getCookieOptions(15 * 60 * 1000));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, this.getCookieOptions(7 * 24 * 60 * 60 * 1000));
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
  }

  private buildTokens(user: { id: number; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: getAccessSecret(),
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: getRefreshSecret(),
      expiresIn: REFRESH_TOKEN_TTL,
    });

    return { accessToken, refreshToken };
  }

  private toPublicUser(user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  }): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  async register(payload: RegisterDto, res: Response): Promise<AuthUserResponseDto> {
    const email = payload.email?.trim().toLowerCase();
    const fullName = payload.fullName?.trim();
    const password = payload.password?.trim();

    if (!email || !password || !fullName) {
      throw new BadRequestException('Missing required fields.');
    }

    const existingUser = await this.prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone: payload.phone?.trim() ?? '',
        role: USER_ROLE.USER,
        status: USER_STATUS.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    const tokens = this.buildTokens(user);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { user: this.toPublicUser(user) };
  }

  async login(payload: LoginDto, res: Response): Promise<AuthUserResponseDto> {
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password?.trim();

    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new UnauthorizedException('Account is disabled.');
    }

    const tokens = this.buildTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { user: this.toPublicUser(user) };
  }

  logout(res: Response): AuthLogoutResponseDto {
    this.clearAuthCookies(res);
    return { message: 'Logged out' };
  }

  async me(req: Request): Promise<AuthUserResponseDto> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[ACCESS_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    try {
      const payload = this.jwtService.verify<{
        sub: number;
        email: string;
        role: string;
      }>(token, {
        secret: getAccessSecret(),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found.');
      }

      return { user: this.toPublicUser(user) };
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }
}
