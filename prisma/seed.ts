import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seedAdmin = async () => {
  const email = 'admin@example.com';

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName: 'Admin User',
      phone: '0000000000',
      role: 'admin',
      status: 'active',
    },
  });
};

const main = async () => {
  await seedAdmin();
};

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
