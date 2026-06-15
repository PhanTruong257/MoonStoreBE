/**
 * Seed runner — 1 lệnh chạy tất cả seed.
 *
 * Quét mọi file `prisma/<YYYYMMDD>-seed-*.ts`, với mỗi file:
 *   - tra bảng `seed_logs` theo tên (= tên file bỏ `.ts`)
 *   - đã có  -> BỎ QUA
 *   - chưa có -> CHẠY (gọi `export default async (prisma) => {...}`) rồi ghi 1 dòng vào `seed_logs`
 *
 * Mỗi seed file phải `export default` một hàm async nhận `PrismaClient`.
 * Muốn cập nhật data sau này -> tạo file seed mới (ngày khác) -> tự chạy lần tới.
 *
 * Run:  pnpm run seed:run     (hoặc: pnpm run prisma:seed)
 */
import { PrismaClient } from '@prisma/client';
import { readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const SEED_PATTERN = /^\d{8}-seed-.*\.ts$/;

async function main(): Promise<void> {
  const dir = __dirname;
  const files = readdirSync(dir)
    .filter((f) => SEED_PATTERN.test(f))
    .sort(); // chạy theo thứ tự ngày tăng dần

  console.log(`Seed runner: tìm thấy ${files.length} file seed.`);

  let ran = 0;
  let skipped = 0;
  for (const file of files) {
    const name = file.replace(/\.ts$/, '');
    const existing = await prisma.seedLog.findUnique({ where: { name } });
    if (existing) {
      console.log(`  SKIP  ${name}  (đã chạy ${existing.ranAt.toISOString()})`);
      skipped++;
      continue;
    }

    console.log(`  RUN   ${name} ...`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(join(dir, file));
    const fn = mod.default ?? mod.seed;
    if (typeof fn !== 'function') {
      throw new Error(`${file} phải export default một hàm async (prisma) => {...}`);
    }
    await fn(prisma);
    await prisma.seedLog.create({ data: { name } });
    console.log(`  DONE  ${name}`);
    ran++;
  }

  console.log(`Seed runner xong. ran=${ran} skipped=${skipped}`);
}

main()
  .catch((e) => {
    console.error('Seed runner failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
