export type CatalogCategoryDto = {
  id: number;
  name: string;
  parentId: number | null;
};

export type CatalogCategoriesResponseDto = {
  categories: CatalogCategoryDto[];
};

export type CatalogProductListItemDto = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  basePrice: number;
  stock: number;
  imageUrl: string;
};

export type CatalogProductsResponseDto = {
  products: CatalogProductListItemDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CatalogOptionDto = {
  id: number;
  name: string;
  priceDelta: number;
  position: number;
};

export type CatalogOptionGroupDto = {
  id: number;
  name: string;
  position: number;
  required: boolean;
  multiSelect: boolean;
  options: CatalogOptionDto[];
};

export type CatalogProductDetailDto = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  basePrice: number;
  stock: number;
  imageUrl: string;
  averageRating: number;
  totalReviews: number;
  optionGroups: CatalogOptionGroupDto[];
};

export type CatalogProductDetailResponseDto = {
  product: CatalogProductDetailDto;
};

export type CatalogModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type CatalogModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};
