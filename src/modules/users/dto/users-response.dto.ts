export type UserProfileDto = {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
};

export type UserProfileResponseDto = {
  user: UserProfileDto;
  address: string | null;
};

export type UsersModuleListResponseDto = {
  module: string;
  message: string;
  tables: unknown[];
};

export type UsersModuleDetailResponseDto = {
  module: string;
  message: string;
  id: number;
};
