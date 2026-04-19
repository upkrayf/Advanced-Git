import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreModel, StorePageResponse } from '../models/store.model';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private apiUrl = '/api/stores';

  constructor(private http: HttpClient) {}

  getAll(params?: { page?: number; size?: number; search?: string; isActive?: boolean }): Observable<StorePageResponse> {
    let p = new HttpParams();
    if (params?.page !== undefined) p = p.set('page', params.page);
    if (params?.size !== undefined) p = p.set('size', params.size);
    if (params?.search) p = p.set('search', params.search);
    if (params?.isActive !== undefined) p = p.set('isActive', params.isActive);
    return this.http.get<StorePageResponse>(this.apiUrl, { params: p });
  }

  getStore(id: number): Observable<StoreModel> {
    return this.http.get<StoreModel>(`${this.apiUrl}/${id}`);
  }

  getMyStore(): Observable<StoreModel> {
    return this.http.get<StoreModel>(`${this.apiUrl}/my`);
  }

  createStore(store: Partial<StoreModel>): Observable<StoreModel> {
    return this.http.post<StoreModel>(this.apiUrl, store);
  }

  updateStore(id: number, store: Partial<StoreModel>): Observable<StoreModel> {
    return this.http.put<StoreModel>(`${this.apiUrl}/${id}`, store);
  }

  toggleActive(id: number): Observable<StoreModel> {
    return this.http.patch<StoreModel>(`${this.apiUrl}/${id}/active`, {});
  }
}
