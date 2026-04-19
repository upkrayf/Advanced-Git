export interface StoreModel {
  id: number;
  name: string;
  description?: string;
  ownerId?: number;
  ownerName?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
  productCount?: number;
  totalOrders?: number;
  totalRevenue?: number;
  createdAt?: string;
  logoUrl?: string;
}

export interface StorePageResponse {
  content: StoreModel[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
