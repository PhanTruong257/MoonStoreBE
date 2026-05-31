export const RETURN_REQUEST_TYPE = {
  RETURN: 'RETURN',
  EXCHANGE: 'EXCHANGE',
} as const;

export type ReturnRequestType = (typeof RETURN_REQUEST_TYPE)[keyof typeof RETURN_REQUEST_TYPE];

export const RETURN_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ITEM_RECEIVED: 'ITEM_RECEIVED',
  COMPLETED: 'COMPLETED',
} as const;

export type ReturnRequestStatus = (typeof RETURN_REQUEST_STATUS)[keyof typeof RETURN_REQUEST_STATUS];
