export type AdminUserDto = {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
};

export type AdminUserListResponseDto = {
  users: AdminUserDto[];
};

export type AdminSellerDto = {
  id: number;
  userId: number;
  shopName: string;
  description: string | null;
  status: string;
  rejectReason: string | null;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    role: string;
  };
};

export type AdminSellerListResponseDto = {
  sellers: AdminSellerDto[];
};

export type AdminSellerActionResponseDto = {
  seller: AdminSellerDto;
};

export type AdminPromoteAdminResponseDto = {
  user: AdminUserDto;
};

export type AdminStatsResponseDto = {
  totalUsers: number;
  totalSellers: number;
  pendingSellers: number;
  totalAdmins: number;
};
