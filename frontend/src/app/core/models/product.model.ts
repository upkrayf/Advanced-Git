export interface ProductModel {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId?: number;
  categoryName?: string;
  storeId?: number;
  storeName?: string;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface ProductPageResponse {
  content: ProductModel[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
