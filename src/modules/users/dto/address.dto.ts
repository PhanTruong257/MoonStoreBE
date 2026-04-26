export type CreateAddressDto = {
  addressLine: string;
  city: string;
  district: string;
  isDefault?: boolean;
};

export type UpdateAddressDto = {
  addressLine?: string;
  city?: string;
  district?: string;
  isDefault?: boolean;
};

export type UserAddressDto = {
  id: number;
  userId: number;
  addressLine: string;
  city: string;
  district: string;
  isDefault: boolean;
};

export type UserAddressListResponseDto = {
  addresses: UserAddressDto[];
};

export type UserAddressResponseDto = {
  address: UserAddressDto;
};
