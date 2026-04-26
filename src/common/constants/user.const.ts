export const USER_ROLE = {
  USER: 'user',
  SELLER: 'seller',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
