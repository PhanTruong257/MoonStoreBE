export type CatalogCategoryDto = {
  id: number;
  name: string;
  parentId: number | null;
};

export type CatalogCategoriesResponseDto = {
  categories: CatalogCategoryDto[];
};

export type CatalogSkuSummaryDto = {
  id: number;
  price: number;
  stock: number;
  imageUrl: string;
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
  defaultSku: CatalogSkuSummaryDto | null;
};

export type CatalogProductsResponseDto = {
  products: CatalogProductListItemDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CatalogOptionDto = {
  value: string;
};

export type CatalogOptionGroupDto = {
  name: string;
  options: CatalogOptionDto[];
};

export type CatalogSkuAttributeDto = {
  name: string;
  value: string;
};

export type CatalogSkuDetailDto = {
  id: number;
  price: number;
  stock: number;
  imageUrl: string;
  attributes: CatalogSkuAttributeDto[];
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
  skus: CatalogSkuDetailDto[];
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
