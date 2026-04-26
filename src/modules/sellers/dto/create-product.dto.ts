export type CreateProductOptionDto = {
  name: string;
  priceDelta?: number;
};

export type CreateProductOptionGroupDto = {
  name: string;
  required?: boolean;
  multiSelect?: boolean;
  options: CreateProductOptionDto[];
};

export type CreateProductDto = {
  name: string;
  description?: string;
  categoryId: number;
  brandId: number;
  basePrice: number;
  stock: number;
  imageUrl: string;
  status?: string;
  optionGroups?: CreateProductOptionGroupDto[];
};
