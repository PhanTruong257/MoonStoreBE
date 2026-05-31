export const SHIPPER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  DISABLED: 'disabled',
} as const;

export type ShipperStatus = (typeof SHIPPER_STATUS)[keyof typeof SHIPPER_STATUS];
