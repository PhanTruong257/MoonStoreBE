export type VietQrConfig = {
  bankBin: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  transferPrefix: string;
};

export const getVietQrConfig = (): VietQrConfig => ({
  bankBin: process.env.QR_BANK_BIN ?? '',
  bankName: process.env.QR_BANK_NAME ?? '',
  accountNo: process.env.QR_ACCOUNT_NO ?? '',
  accountName: process.env.QR_ACCOUNT_NAME ?? '',
  transferPrefix: process.env.QR_TRANSFER_PREFIX ?? 'MOON',
});

export const buildTransferContent = (prefix: string, orderId: number): string =>
  `${prefix}${orderId}`;

export const buildVietQrImageUrl = (
  config: VietQrConfig,
  amount: number,
  transferContent: string
): string => {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: transferContent,
    accountName: config.accountName,
  });
  return `https://img.vietqr.io/image/${config.bankBin}-${config.accountNo}-compact2.png?${params.toString()}`;
};
