export type GenerateProductContentDto = {
  imageUrl: string;
  name?: string;
  categoryId?: number;
  brandId?: number;
};

export type ProductContentResponseDto = {
  title: string;
  description: string;
  highlights: { label: string; value: string }[];
};
