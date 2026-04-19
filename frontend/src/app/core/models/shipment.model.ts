export interface ShipmentModel {
  id: number;
  orderId: number;
  orderDate?: string;
  customerName?: string;
  trackingNo?: string;
  carrier?: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'FAILED';
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
