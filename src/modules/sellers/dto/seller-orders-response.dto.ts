export type SellerOrderItemSelectedOptionDto = {
  groupName: string;
  optionName: string;
  priceDelta: number;
};

export type SellerOrderItemDto = {
  id: number;
  productId: number;
  productName: string;
  basePriceAtTime: number;
  optionsTotalAtTime: number;
  unitPriceAtTime: number;
  imageUrl: string;
  quantity: number;
  selectedOptions: SellerOrderItemSelectedOptionDto[];
};

export type SellerOrderGroupDto = {
  id: number;
  orderId: number;
  status: string;
  subtotal: number;
  shippingFee: number;
  createdAt: string;
  buyer: {
    id: number;
    fullName: string;
    phone: string;
  };
  items: SellerOrderItemDto[];
};

export type SellerOrderListResponseDto = {
  groups: SellerOrderGroupDto[];
};

export type SellerOrderDetailResponseDto = {
  group: SellerOrderGroupDto & {
    shippingAddress: Record<string, unknown> | null;
    statusLogs: Array<{
      id: number;
      status: string;
      note: string | null;
      createdAt: string;
    }>;
  };
};

export type SellerStatsResponseDto = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
};

export type SellerProductListItemDto = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  categoryId: number;
  brandId: number;
  basePrice: number;
  stock: number;
  imageUrl: string;
};

export type SellerProductListResponseDto = {
  products: SellerProductListItemDto[];
};
