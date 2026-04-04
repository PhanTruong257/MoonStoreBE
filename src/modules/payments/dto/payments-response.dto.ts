export type PaymentsModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type PaymentsModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};
