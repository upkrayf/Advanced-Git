import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryModel, CreateCategoryRequest } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = '/api/categories';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoryModel[]> {
    return this.http.get<CategoryModel[]>(this.apiUrl);
  }

  getCategory(id: number): Observable<CategoryModel> {
    return this.http.get<CategoryModel>(`${this.apiUrl}/${id}`);
  }

  createCategory(cat: CreateCategoryRequest): Observable<CategoryModel> {
    return this.http.post<CategoryModel>(this.apiUrl, cat);
  }

  updateCategory(id: number, cat: Partial<CategoryModel>): Observable<CategoryModel> {
    return this.http.put<CategoryModel>(`${this.apiUrl}/${id}`, cat);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
