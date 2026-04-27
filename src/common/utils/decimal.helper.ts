import { Prisma } from '@prisma/client';

/**
 * Convert a JS number / numeric string to a Prisma Decimal for write operations.
 */
export const toDecimal = (value: number | string): Prisma.Decimal =>
  new Prisma.Decimal(value);

/**
 * Convert a Prisma Decimal (or null) to a JS number for response serialization.
 * Returns null if input is null.
 */
export const decimalToNumber = (
  value: Prisma.Decimal | null | undefined,
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
};

/**
 * Same as `decimalToNumber` but returns 0 for null/undefined — convenient
 * for required money fields where the schema disallows null.
 */
export const decimalToNumberOrZero = (
  value: Prisma.Decimal | null | undefined,
): number => Number(value ?? 0);
