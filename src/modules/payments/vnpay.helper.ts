import { createHmac } from 'crypto';

export type VnpayConfig = {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
};

export type VnpayPaymentInput = {
  amount: number;
  txnRef: string;
  orderInfo: string;
  ipAddr: string;
  bankCode?: string;
};

export const getVnpayConfig = (): VnpayConfig => ({
  tmnCode: process.env.VNPAY_TMN_CODE ?? '',
  hashSecret: process.env.VNPAY_HASH_SECRET ?? '',
  url: process.env.VNPAY_URL ?? '',
  returnUrl: process.env.VNPAY_RETURN_URL ?? '',
});

const formatDateYmdHis = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
};

const sortAndStringify = (params: Record<string, string>): string => {
  return Object.keys(params)
    .sort()
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`
    )
    .join('&');
};

const computeHmacSha512 = (secret: string, data: string): string => {
  return createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
};

export const buildVnpayPaymentUrl = (config: VnpayConfig, input: VnpayPaymentInput): string => {
  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: input.txnRef,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: String(Math.round(input.amount * 100)),
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: input.ipAddr,
    vnp_CreateDate: formatDateYmdHis(new Date()),
  };
  if (input.bankCode) {
    params.vnp_BankCode = input.bankCode;
  }

  const signData = sortAndStringify(params);
  const hash = computeHmacSha512(config.hashSecret, signData);

  return `${config.url}?${signData}&vnp_SecureHash=${hash}`;
};

export const verifyVnpaySignature = (
  hashSecret: string,
  query: Record<string, string>
): boolean => {
  const incomingHash = query.vnp_SecureHash;
  if (!incomingHash) {
    return false;
  }

  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') {
      continue;
    }
    filtered[key] = value;
  }

  const signData = sortAndStringify(filtered);
  const expected = computeHmacSha512(hashSecret, signData);
  return expected.toLowerCase() === incomingHash.toLowerCase();
};

export const VNPAY_RESPONSE_CODE_SUCCESS = '00';
export const VNPAY_TRANSACTION_STATUS_SUCCESS = '00';
