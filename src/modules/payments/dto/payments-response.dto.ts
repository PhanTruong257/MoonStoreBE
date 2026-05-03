export type VnpayReturnResponseDto = {
  paid: boolean;
  orderId: number | null;
  paymentId: number | null;
  message: string;
};

export type VnpayIpnResponseDto = {
  RspCode: string;
  Message: string;
};

export type QrPaymentInfoDto = {
  paymentId: number;
  orderId: number;
  amount: number;
  bankBin: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  transferContent: string;
  qrUrl: string;
  paymentStatus: string;
  expiresAt: string | null;
};

export type ConfirmManualResponseDto = {
  paymentId: number;
  orderId: number;
  paymentStatus: string;
};
