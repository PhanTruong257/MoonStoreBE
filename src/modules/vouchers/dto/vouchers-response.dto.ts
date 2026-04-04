export type VouchersModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type VouchersModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};
