export type AddToCartDto = {
  userId?: number;
  productId: number;
  optionIds?: number[];
  quantity?: number;
};
