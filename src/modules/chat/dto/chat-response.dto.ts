export type ChatModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type ChatModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};
