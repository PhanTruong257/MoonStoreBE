export type OrdersModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type OrdersModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};
