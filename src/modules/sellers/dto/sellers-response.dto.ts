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
};

export type CreateSellerResponseDto = {
  seller: SellerProfileDto;
};

export type SellerProductDto = {
  id: number;
  sellerId: number;
  name: string;
  description: string | null;
  status: string;
  categoryId: number;
  brandId: number;
};

export type SellerProductSkuDto = {
  id: number;
  productId: number;
  skuCode: string;
  price: number;
  stock: number;
  imageUrl: string;
};

export type CreateProductResponseDto = {
  product: SellerProductDto;
  sku: SellerProductSkuDto;
};
