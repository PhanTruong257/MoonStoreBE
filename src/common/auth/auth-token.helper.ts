import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export const ACCESS_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

export const getAccessSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
};

export const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  return secret;
};

export const extractUserIdFromRequest = (req: Request, jwtService: JwtService): number => {
  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.[ACCESS_COOKIE_NAME];
  if (!token) {
    throw new UnauthorizedException('Missing access token.');
  }

  try {
    const payload = jwtService.verify<{ sub: number }>(token, {
      secret: getAccessSecret(),
    });
    return payload.sub;
  } catch {
    throw new UnauthorizedException('Invalid access token.');
  }
};
