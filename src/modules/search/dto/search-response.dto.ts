export type SearchModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type SearchModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};
