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
    // eslint-disable-next-line no-console
    console.log('[auth-debug] Missing access token. req.cookies =', cookies, ' raw header =', req.headers.cookie);
    throw new UnauthorizedException('Missing access token.');
  }

  try {
    const payload = jwtService.verify<{ sub: number }>(token, {
      secret: getAccessSecret(),
    });
    return payload.sub;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('[auth-debug] Invalid access token. token =', token.slice(0, 20), '... err =', (err as Error).message);
    throw new UnauthorizedException('Invalid access token.');
  }
};
