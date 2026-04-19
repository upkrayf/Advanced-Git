export interface OrderItemModel {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderModel {
  id: number;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  storeId?: number;
  storeName?: string;
  items?: OrderItemModel[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  shippingAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderPageResponse {
  content: OrderModel[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateOrderRequest {
  storeId: number;
  items: { productId: number; quantity: number }[];
  shippingAddress: string;
}
