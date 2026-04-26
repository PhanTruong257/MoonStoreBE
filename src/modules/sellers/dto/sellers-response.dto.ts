export type SellersModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type SellersModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};

export type SellerProfileDto = {
  id: number;
  userId: number;
  shopName: string;
  description: string | null;
  status: string;
  rejectReason: string | null;
};

export type CreateSellerResponseDto = {
  seller: SellerProfileDto;
};

export type SellerProfileMeResponseDto = {
  seller: SellerProfileDto | null;
};

export type SellerProductOptionDto = {
  id: number;
  name: string;
  priceDelta: number;
  position: number;
};

export type SellerProductOptionGroupDto = {
  id: number;
  name: string;
  position: number;
  required: boolean;
  multiSelect: boolean;
  options: SellerProductOptionDto[];
};

export type SellerProductDto = {
  id: number;
  sellerId: number;
  name: string;
  description: string | null;
  status: string;
  categoryId: number;
  brandId: number;
  basePrice: number;
  stock: number;
  imageUrl: string;
  optionGroups: SellerProductOptionGroupDto[];
};

export type CreateProductResponseDto = {
  product: SellerProductDto;
};
