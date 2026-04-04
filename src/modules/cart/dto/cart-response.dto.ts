export type CartModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type CartModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};

export type CartSkuProductDto = {
  id: number;
  name: string;
};

export type CartSkuDto = {
  id: number;
  price: number;
  stock: number;
  imageUrl: string;
  product: CartSkuProductDto;
};

export type CartItemDto = {
  id: number;
  quantity: number;
  sku: CartSkuDto;
};

export type CartResponseDto = {
  cartId: number;
  userId: number;
  items: CartItemDto[];
};

export type CartAddItemResponseDto = {
  cartId: number;
  itemId: number;
  skuId: number;
  quantity: number;
};

export type CartUpdateItemResponseDto = {
  itemId: number;
  quantity: number;
};

export type CartRemoveItemResponseDto = {
  itemId: number;
};
