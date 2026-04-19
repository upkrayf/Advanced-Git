export interface CustomerProfileModel {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  avgOrderValue?: number;
  createdAt?: string;
}

export interface CustomerPageResponse {
  content: CustomerProfileModel[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
