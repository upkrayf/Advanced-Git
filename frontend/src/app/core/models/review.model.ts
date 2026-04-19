export interface ReviewModel {
  id: number;
  productId: number;
  productName?: string;
  userId: number;
  userName?: string;
  rating: number;
  comment?: string;
  storeResponse?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}
