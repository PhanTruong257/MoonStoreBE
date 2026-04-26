export const VOUCHER_DISCOUNT_TYPE = {
  PERCENT: 'percent',
  FIXED: 'fixed',
} as const;

export type VoucherDiscountType =
  (typeof VOUCHER_DISCOUNT_TYPE)[keyof typeof VOUCHER_DISCOUNT_TYPE];

export const VOUCHER_DISCOUNT_TYPES: VoucherDiscountType[] = [
  VOUCHER_DISCOUNT_TYPE.PERCENT,
  VOUCHER_DISCOUNT_TYPE.FIXED,
];
