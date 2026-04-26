export type ReviewsModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type ReviewsModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};

export type ReviewItemDto = {
  id: number;
  rating: number;
  comment: string | null;
  user: {
    id: number;
    fullName: string;
  };
};

export type ProductReviewsResponseDto = {
  productId: number;
  averageRating: number;
  totalReviews: number;
  reviews: ReviewItemDto[];
};

export type ReviewEligibilityResponseDto = {
  productId: number;
  canReview: boolean;
  reason: string | null;
  existingReviewId: number | null;
};

export type CreateReviewResponseDto = {
  review: ReviewItemDto;
};
