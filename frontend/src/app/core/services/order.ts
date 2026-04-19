import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderModel, OrderPageResponse, CreateOrderRequest } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = '/api/orders';

  constructor(private http: HttpClient) {}

  getOrders(params?: {
    page?: number; size?: number; status?: string;
    storeId?: number; customerId?: number;
  }): Observable<OrderPageResponse> {
    let p = new HttpParams();
    if (params?.page !== undefined) p = p.set('page', params.page);
    if (params?.size !== undefined) p = p.set('size', params.size);
    if (params?.status) p = p.set('status', params.status);
    if (params?.storeId) p = p.set('storeId', params.storeId);
    if (params?.customerId) p = p.set('customerId', params.customerId);
    return this.http.get<OrderPageResponse>(this.apiUrl, { params: p });
  }

  getOrder(id: number): Observable<OrderModel> {
    return this.http.get<OrderModel>(`${this.apiUrl}/${id}`);
  }

  getMyOrders(page = 0, size = 20): Observable<OrderPageResponse> {
    const p = new HttpParams().set('page', page).set('size', size);
    return this.http.get<OrderPageResponse>(`${this.apiUrl}/my`, { params: p });
  }

  createOrder(order: CreateOrderRequest): Observable<OrderModel> {
    return this.http.post<OrderModel>(this.apiUrl, order);
  }

  updateStatus(id: number, status: string): Observable<OrderModel> {
    return this.http.patch<OrderModel>(`${this.apiUrl}/${id}/status`, { status });
  }

  cancelOrder(id: number): Observable<OrderModel> {
    return this.http.patch<OrderModel>(`${this.apiUrl}/${id}/status`, { status: 'CANCELLED' });
  }
}
