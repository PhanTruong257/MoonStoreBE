import type {
  CreateProductOptionGroupDto,
  ProductHighlightDto,
} from './create-product.dto';

export type UpdateSellerProductDto = {
  name?: string;
  description?: string | null;
  status?: string;
  categoryId?: number;
  brandId?: number;
  basePrice?: number;
  stock?: number;
  imageUrl?: string;
  optionGroups?: CreateProductOptionGroupDto[];
  highlights?: ProductHighlightDto[];
};
