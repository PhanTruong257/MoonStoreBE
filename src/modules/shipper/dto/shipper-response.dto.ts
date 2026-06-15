export interface ShipperApplyResponseDto {
  id: number;
  userId: number;
  status: string;
  createdAt: string;
}

export interface ShipperProfileResponseDto {
  id: number;
  userId: number;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface ShipperShipmentItemDto {
  id: number;
  orderGroupId: number;
  carrier: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  orderGroup: {
    id: number;
    status: string;
    order: {
      id: number;
      shippingAddress: unknown;
    };
  };
}

export interface ShipperShipmentsResponseDto {
  shipments: ShipperShipmentItemDto[];
}

export interface UpdateShipmentStatusResponseDto {
  id: number;
  status: string;
}
