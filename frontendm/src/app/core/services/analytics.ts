import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PlatformKpis, CorporateKpis, IndividualStats,
  RevenuePoint, OrderStatusCount, TopProduct,
  CategorySales, SpendingByCategory, AuditLog
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class Analytics {
  private apiUrl = '/api/analytics';

  constructor(private http: HttpClient) {}

  // Platform (Admin)
  getPlatformKpis(): Observable<PlatformKpis> {
    return this.http.get<PlatformKpis>(`${this.apiUrl}/platform/kpis`);
  }

  getRevenue(period: 'daily' | 'monthly' | 'yearly' = 'monthly'): Observable<RevenuePoint[]> {
    const p = new HttpParams().set('period', period);
    return this.http.get<RevenuePoint[]>(`${this.apiUrl}/revenue`, { params: p });
  }

  getOrderStatus(): Observable<OrderStatusCount[]> {
    return this.http.get<OrderStatusCount[]>(`${this.apiUrl}/orders/status`);
  }

  getTopProducts(limit = 10): Observable<TopProduct[]> {
    const p = new HttpParams().set('limit', limit);
    return this.http.get<TopProduct[]>(`${this.apiUrl}/products/top`, { params: p });
  }

  getSalesByCategory(): Observable<CategorySales[]> {
    return this.http.get<CategorySales[]>(`${this.apiUrl}/categories/sales`);
  }

  getShipmentStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/shipments/stats`);
  }

  getUserStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/stats`);
  }

  getAuditLogs(page = 0, size = 50): Observable<any> {
    const p = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(`/api/audit-logs`, { params: p });
  }

  // Corporate
  getCorporateKpis(): Observable<CorporateKpis> {
    return this.http.get<CorporateKpis>(`${this.apiUrl}/corporate/kpis`);
  }

  getStoreRevenue(period: 'daily' | 'monthly' | 'yearly' = 'monthly'): Observable<RevenuePoint[]> {
    const p = new HttpParams().set('period', period);
    return this.http.get<RevenuePoint[]>(`${this.apiUrl}/store/revenue`, { params: p });
  }

  getStoreTopProducts(limit = 10): Observable<TopProduct[]> {
    const p = new HttpParams().set('limit', limit);
    return this.http.get<TopProduct[]>(`${this.apiUrl}/store/products/top`, { params: p });
  }

  // Individual
  getMyStats(): Observable<IndividualStats> {
    return this.http.get<IndividualStats>(`${this.apiUrl}/my/stats`);
  }

  getMySpendingByCategory(): Observable<SpendingByCategory[]> {
    return this.http.get<SpendingByCategory[]>(`${this.apiUrl}/my/spending/category`);
  }

  getMySpendingTrend(period = 'monthly'): Observable<RevenuePoint[]> {
    const p = new HttpParams().set('period', period);
    return this.http.get<RevenuePoint[]>(`${this.apiUrl}/my/spending/trend`, { params: p });
  }
}
