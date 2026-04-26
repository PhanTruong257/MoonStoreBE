export type AdminOrderListItemDto = {
  id: number;
  userId: number;
  userFullName: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  groupCount: number;
};

export type AdminOrderListResponseDto = {
  orders: AdminOrderListItemDto[];
};

export type AdminOrderItemDto = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPriceAtTime: number;
  imageUrl: string;
};

export type AdminOrderGroupDto = {
  id: number;
  sellerId: number;
  sellerShopName: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  items: AdminOrderItemDto[];
};

export type AdminOrderDetailDto = {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  voucherId: number | null;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  shippingAddress: Record<string, unknown> | null;
  createdAt: string;
  groups: AdminOrderGroupDto[];
};

export type AdminOrderDetailResponseDto = {
  order: AdminOrderDetailDto;
};
