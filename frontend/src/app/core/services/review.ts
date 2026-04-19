import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReviewModel, CreateReviewRequest } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private apiUrl = '/api/reviews';

  constructor(private http: HttpClient) {}

  getAll(params?: { page?: number; size?: number; storeId?: number }): Observable<any> {
    let p = new HttpParams();
    if (params?.page !== undefined) p = p.set('page', params.page);
    if (params?.size !== undefined) p = p.set('size', params.size);
    if (params?.storeId) p = p.set('storeId', params.storeId);
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getByProduct(productId: number): Observable<ReviewModel[]> {
    return this.http.get<ReviewModel[]>(`${this.apiUrl}/product/${productId}`);
  }

  getMyReviews(): Observable<ReviewModel[]> {
    return this.http.get<ReviewModel[]>(`${this.apiUrl}/my`);
  }

  addReview(review: CreateReviewRequest): Observable<ReviewModel> {
    return this.http.post<ReviewModel>(this.apiUrl, review);
  }

  respondToReview(id: number, response: string): Observable<ReviewModel> {
    return this.http.patch<ReviewModel>(`${this.apiUrl}/${id}/respond`, { response });
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
