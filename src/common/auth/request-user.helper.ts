import { ForbiddenException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { ensureAdminRole } from './admin-guard.helper';
import { extractUserIdFromRequest } from './auth-token.helper';
import { SELLER_STATUS } from '../constants';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Extract userId from JWT cookie. Throws UnauthorizedException if missing/invalid.
 * Thin re-export so service code only imports from one place.
 */
export const getUserIdFromRequest = (
  req: Request,
  jwt: JwtService,
): number => extractUserIdFromRequest(req, jwt);

/**
 * Verify the request is from an active admin. Returns the admin's userId.
 * Used by every endpoint under `/admin/*`.
 */
export const assertAdminFromRequest = async (
  req: Request,
  jwt: JwtService,
  prisma: PrismaService,
): Promise<number> => {
  const userId = extractUserIdFromRequest(req, jwt);
  await ensureAdminRole(prisma, userId);
  return userId;
};

/**
 * Look up the seller profile for a user and return its id, but only if the
 * profile is active. Throws ForbiddenException otherwise (covers no-profile,
 * pending, rejected, disabled).
 */
export const getActiveSellerIdForUser = async (
  prisma: PrismaService,
  userId: number,
): Promise<number> => {
  const seller = await prisma.seller.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });

  if (!seller || seller.status !== SELLER_STATUS.ACTIVE) {
    throw new ForbiddenException('Active seller profile not found.');
  }

  return seller.id;
};
