import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductModel, ProductPageResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = '/api/products';

  constructor(private http: HttpClient) {}

  getProducts(params?: {
    page?: number; size?: number; categoryId?: number;
    storeId?: number; search?: string; minPrice?: number; maxPrice?: number;
  }): Observable<ProductPageResponse> {
    let p = new HttpParams();
    if (params?.page !== undefined) p = p.set('page', params.page);
    if (params?.size !== undefined) p = p.set('size', params.size);
    if (params?.categoryId) p = p.set('categoryId', params.categoryId);
    if (params?.storeId) p = p.set('storeId', params.storeId);
    if (params?.search) p = p.set('search', params.search);
    if (params?.minPrice !== undefined) p = p.set('minPrice', params.minPrice);
    if (params?.maxPrice !== undefined) p = p.set('maxPrice', params.maxPrice);
    return this.http.get<ProductPageResponse>(this.apiUrl, { params: p });
  }

  getProduct(id: number): Observable<ProductModel> {
    return this.http.get<ProductModel>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Partial<ProductModel>): Observable<ProductModel> {
    return this.http.post<ProductModel>(this.apiUrl, product);
  }

  updateProduct(id: number, product: Partial<ProductModel>): Observable<ProductModel> {
    return this.http.put<ProductModel>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByStore(storeId: number, page = 0, size = 20): Observable<ProductPageResponse> {
    const p = new HttpParams().set('storeId', storeId).set('page', page).set('size', size);
    return this.http.get<ProductPageResponse>(this.apiUrl, { params: p });
  }

  getByCategory(categoryId: number, page = 0, size = 20): Observable<ProductPageResponse> {
    const p = new HttpParams().set('categoryId', categoryId).set('page', page).set('size', size);
    return this.http.get<ProductPageResponse>(this.apiUrl, { params: p });
  }
}
