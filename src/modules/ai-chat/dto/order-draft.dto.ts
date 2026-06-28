/**
 * Bản nháp đơn hàng do AI chuẩn bị (chưa ghi DB). FE render thành thẻ xác nhận.
 */
export type OrderDraftItem = {
  productId: number;
  name: string;
  quantity: number;
  optionIds: number[];
  unitPrice: number;
  lineTotal: number;
};

export type OrderDraftAddress = {
  addressId: number | null;
  text: string;
};

export type OrderDraft = {
  items: OrderDraftItem[];
  address: OrderDraftAddress | null;
  voucherCode: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: string;
  warnings: string[];
};

/** Sản phẩm agent tìm được (surface cho FE render card, giống luồng tư vấn cũ). */
export type AgentProduct = {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
};
