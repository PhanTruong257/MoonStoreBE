export const SELLER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  DISABLED: 'disabled',
} as const;

export type SellerStatus = (typeof SELLER_STATUS)[keyof typeof SELLER_STATUS];
