export type VouchersModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type VouchersModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};

export type VoucherValidateResponseDto = {
  isValid: boolean;
  reason: string | null;
  voucher: {
    id: number;
    code: string;
    discountType: string;
    value: number;
    maxDiscount: number | null;
    expiredAt: string;
  } | null;
  discountAmount: number;
};
