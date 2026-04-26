export type CreateOrderDto = {
  voucherCode?: string;
  shippingFee?: number;
  paymentMethod?: string;
  shippingAddress?: Record<string, unknown>;
  addressId?: number;
};
