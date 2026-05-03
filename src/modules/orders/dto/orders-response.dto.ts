export type OrderItemSelectedOptionDto = {
  groupName: string;
  optionName: string;
  priceDelta: number;
};

export type OrderItemDto = {
  id: number;
  productId: number;
  productName: string;
  basePriceAtTime: number;
  optionsTotalAtTime: number;
  unitPriceAtTime: number;
  imageUrlAtTime: string;
  quantity: number;
  selectedOptions: OrderItemSelectedOptionDto[];
};

export type OrderGroupDto = {
  id: number;
  sellerId: number;
  status: string;
  subtotal: number;
  shippingFee: number;
  items?: OrderItemDto[];
};

export type OrderDto = {
  id: number;
  userId: number;
  voucherId?: number | null;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  shippingAddress: Record<string, unknown> | null;
  createdAt: string;
  groups?: OrderGroupDto[];
};

export type OrderCreateQrInfoDto = {
  paymentId: number;
  amount: number;
  bankBin: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  transferContent: string;
  qrUrl: string;
};

export type OrderCreateResponseDto = {
  orderId: number;
  paymentUrl?: string;
  qrInfo?: OrderCreateQrInfoDto;
};

export type OrderListResponseDto = {
  orders: OrderDto[];
};

export type OrderDetailResponseDto = {
  order: OrderDto;
};

export type OrderGroupStatusResponseDto = {
  groupId: number;
  status: string;
};
