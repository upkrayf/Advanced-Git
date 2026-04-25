export interface OrderItemModel {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  // Backend'den gelen raw alanlar (normalize edilmeden önce)
  product?: { id?: number; name?: string; unitPrice?: number; sku?: string };
  price?: number;
}

export interface OrderModel {
  id: number;
  orderNumber?: string;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  storeId?: number;
  storeName?: string;
  items?: OrderItemModel[];
  totalAmount: number;
  status: string;
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
