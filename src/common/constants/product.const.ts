export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  DELETED: 'deleted',
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
