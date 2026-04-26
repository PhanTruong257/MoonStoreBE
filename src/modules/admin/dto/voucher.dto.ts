export type AdminVoucherDto = {
  id: number;
  code: string;
  discountType: string;
  value: number;
  maxDiscount: number | null;
  expiredAt: string;
  usageCount: number;
};

export type AdminVoucherListResponseDto = {
  vouchers: AdminVoucherDto[];
};

export type AdminVoucherResponseDto = {
  voucher: AdminVoucherDto;
};

export type AdminVoucherUsageDto = {
  id: number;
  userId: number;
  orderId: number;
  userEmail: string;
  userFullName: string;
};

export type AdminVoucherUsageListResponseDto = {
  usages: AdminVoucherUsageDto[];
};

export type CreateVoucherDto = {
  code: string;
  discountType: string;
  value: number;
  maxDiscount?: number | null;
  expiredAt: string;
};

export type UpdateVoucherDto = {
  code?: string;
  discountType?: string;
  value?: number;
  maxDiscount?: number | null;
  expiredAt?: string;
};
