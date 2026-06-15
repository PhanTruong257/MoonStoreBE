import { PrismaClient } from '@prisma/client';
import { createWriteStream } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const OUT = join(process.cwd(), 'moon_store-full-dump.sql');
const PAGE = 500;
const MAX_STMT_BYTES = 400 * 1024; // keep each multi-row INSERT well under max_allowed_packet

const out = createWriteStream(OUT, { encoding: 'utf8' });
const write = (s) =>
  new Promise((res) => {
    if (!out.write(s)) out.once('drain', res);
    else res();
  });

const q = (s) =>
  "'" +
  String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
    .replace(/\x00/g, '\\0') +
  "'";

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

function sqlVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (v instanceof Date) return q(fmtDate(v));
  if (Buffer.isBuffer(v)) return `0x${v.toString('hex')}`;
  if (typeof v === 'object') {
    if (v.constructor && v.constructor.name === 'Decimal') return v.toString();
    return q(JSON.stringify(v)); // safety net; JSON cols are already cast to CHAR
  }
  return q(String(v));
}

async function main() {
  const tablesRaw = await prisma.$queryRawUnsafe(
    "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type='BASE TABLE' ORDER BY table_name",
  );
  const tables = tablesRaw.map((r) => r.t);

  await write(`-- Moon Store full data dump\n`);
  await write(`-- Restore on server:  mysql -u <user> -p <db_name> < moon_store-full-dump.sql\n`);
  await write(`SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\nSET UNIQUE_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n\n`);

  let grandRows = 0;
  for (const table of tables) {
    const cols = await prisma.$queryRawUnsafe(
      'SELECT column_name AS name, data_type AS type FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? ORDER BY ordinal_position',
      table,
    );
    const colNames = cols.map((c) => c.name);
    const hasId = colNames.includes('id');
    const selectList = cols
      .map((c) => (c.type === 'json' ? `CAST(\`${c.name}\` AS CHAR) AS \`${c.name}\`` : `\`${c.name}\``))
      .join(', ');
    const colSql = colNames.map((c) => `\`${c}\``).join(', ');

    // DDL
    const createRow = await prisma.$queryRawUnsafe(`SHOW CREATE TABLE \`${table}\``);
    // Prisma returns SHOW CREATE TABLE columns positionally as f0 (name), f1 (DDL).
    const ddl = Object.values(createRow[0])[1];
    await write(`-- ----- ${table} -----\nDROP TABLE IF EXISTS \`${table}\`;\n${ddl};\n`);

    // Data (keyset pagination by id when available, else single fetch)
    let rowsWritten = 0;
    let buf = '';
    let bufCount = 0;
    const flush = async () => {
      if (bufCount === 0) return;
      await write(`INSERT INTO \`${table}\` (${colSql}) VALUES ${buf};\n`);
      buf = '';
      bufCount = 0;
    };

    const handleRows = async (rows) => {
      for (const row of rows) {
        const tuple = '(' + colNames.map((c) => sqlVal(row[c])).join(',') + ')';
        if (bufCount > 0 && buf.length + tuple.length + 1 > MAX_STMT_BYTES) await flush();
        buf += (bufCount ? ',' : '') + tuple;
        bufCount++;
        rowsWritten++;
      }
    };

    if (hasId) {
      let lastId = -Infinity;
      // use 0 as initial lower bound (ids are positive autoincrement)
      let cursor = 0;
      for (;;) {
        const rows = await prisma.$queryRawUnsafe(
          `SELECT ${selectList} FROM \`${table}\` WHERE \`id\` > ? ORDER BY \`id\` LIMIT ${PAGE}`,
          cursor,
        );
        if (rows.length === 0) break;
        await handleRows(rows);
        cursor = Number(rows[rows.length - 1].id);
        if (rows.length < PAGE) break;
        void lastId;
      }
    } else {
      const rows = await prisma.$queryRawUnsafe(`SELECT ${selectList} FROM \`${table}\``);
      await handleRows(rows);
    }
    await flush();
    await write('\n');
    grandRows += rowsWritten;
    console.log(`  ${table}: ${rowsWritten} rows`);
  }

  await write(`SET FOREIGN_KEY_CHECKS=1;\nSET UNIQUE_CHECKS=1;\n`);
  await new Promise((res) => out.end(res));
  console.log(`\nDONE. tables=${tables.length} totalRows=${grandRows} -> ${OUT}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('DUMP FAILED:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
