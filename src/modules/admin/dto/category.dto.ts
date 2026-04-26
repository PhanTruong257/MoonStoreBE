export type AdminCategoryDto = {
  id: number;
  name: string;
  parentId: number | null;
  productCount: number;
  childCount: number;
};

export type AdminCategoryListResponseDto = {
  categories: AdminCategoryDto[];
};

export type AdminCategoryResponseDto = {
  category: AdminCategoryDto;
};

export type CreateCategoryDto = {
  name: string;
  parentId?: number | null;
};

export type UpdateCategoryDto = {
  name?: string;
  parentId?: number | null;
};
