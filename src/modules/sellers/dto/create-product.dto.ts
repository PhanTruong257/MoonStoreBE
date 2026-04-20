export type CreateProductDto = {
  userId: number;
  name: string;
  description?: string;
  categoryId: number;
  brandId: number;
  price: number;
  stock: number;
  imageUrl: string;
  skuCode?: string;
  status?: string;
};
