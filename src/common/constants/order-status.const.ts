export const ORDER_GROUP_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderGroupStatus =
  (typeof ORDER_GROUP_STATUS)[keyof typeof ORDER_GROUP_STATUS];

/** Sequential flow used for advancing status (excludes terminal states). */
export const ORDER_GROUP_STATUS_FLOW: OrderGroupStatus[] = [
  ORDER_GROUP_STATUS.PENDING,
  ORDER_GROUP_STATUS.CONFIRMED,
  ORDER_GROUP_STATUS.SHIPPING,
  ORDER_GROUP_STATUS.DELIVERED,
];

export const ORDER_STATUS = ORDER_GROUP_STATUS;
export type OrderStatus = OrderGroupStatus;
