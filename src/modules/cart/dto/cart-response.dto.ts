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

export type CartItemSelectedOptionDto = {
  optionId: number;
  groupName: string;
  optionName: string;
  priceDelta: number;
};

export type CartItemProductDto = {
  id: number;
  name: string;
  basePrice: number;
  stock: number;
  imageUrl: string;
};

export type CartItemDto = {
  id: number;
  quantity: number;
  unitPrice: number;
  product: CartItemProductDto;
  selectedOptions: CartItemSelectedOptionDto[];
};

export type CartResponseDto = {
  cartId: number;
  userId: number;
  items: CartItemDto[];
};

export type CartAddItemResponseDto = {
  cartId: number;
  itemId: number;
  productId: number;
  quantity: number;
};

export type CartUpdateItemResponseDto = {
  itemId: number;
  quantity: number;
};

export type CartRemoveItemResponseDto = {
  itemId: number;
};
