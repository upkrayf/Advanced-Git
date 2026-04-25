export interface ShipmentModel {
  id: number;
  orderId: number;
  orderNumber?: string;
  customerName?: string;
  trackingNo?: string;
  carrier?: string;
  status: string;
  modeOfShipment?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  shippingAddress?: string;
  createdAt?: string;
}

export interface ShipmentPageResponse {
  content: ShipmentModel[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
