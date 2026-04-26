import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export const ACCESS_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

export const getAccessSecret = () => process.env.JWT_SECRET ?? 'dev-secret';

export const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';

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
