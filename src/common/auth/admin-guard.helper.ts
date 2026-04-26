import { ForbiddenException } from '@nestjs/common';

import type { PrismaService } from '../../prisma/prisma.service';

export const ensureAdminRole = async (prisma: PrismaService, userId: number): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'admin') {
    throw new ForbiddenException('Admin role required.');
  }
};
