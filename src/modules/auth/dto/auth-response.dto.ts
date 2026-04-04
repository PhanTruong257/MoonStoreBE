export type AuthUserDto = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

export type AuthUserResponseDto = {
  user: AuthUserDto;
};

export type AuthLogoutResponseDto = {
  message: string;
};
