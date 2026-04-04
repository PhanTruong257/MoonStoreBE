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
