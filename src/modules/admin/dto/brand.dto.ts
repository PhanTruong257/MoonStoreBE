export type AdminBrandDto = {
  id: number;
  name: string;
  productCount: number;
};

export type AdminBrandListResponseDto = {
  brands: AdminBrandDto[];
};

export type AdminBrandResponseDto = {
  brand: AdminBrandDto;
};

export type CreateBrandDto = {
  name: string;
};

export type UpdateBrandDto = {
  name?: string;
};
