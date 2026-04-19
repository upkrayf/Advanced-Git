import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserModel, UserPageResponse, CreateUserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  getUsers(params?: {
    page?: number; size?: number; role?: string; search?: string;
  }): Observable<UserPageResponse> {
    let p = new HttpParams();
    if (params?.page !== undefined) p = p.set('page', params.page);
    if (params?.size !== undefined) p = p.set('size', params.size);
    if (params?.role) p = p.set('role', params.role);
    if (params?.search) p = p.set('search', params.search);
    return this.http.get<UserPageResponse>(this.apiUrl, { params: p });
  }

  getUser(id: number): Observable<UserModel> {
    return this.http.get<UserModel>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<UserModel> {
    return this.http.post<UserModel>(this.apiUrl, user);
  }

  updateUser(id: number, user: Partial<UserModel>): Observable<UserModel> {
    return this.http.put<UserModel>(`${this.apiUrl}/${id}`, user);
  }

  toggleStatus(id: number): Observable<UserModel> {
    return this.http.patch<UserModel>(`${this.apiUrl}/${id}/status`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getMe(): Observable<UserModel> {
    return this.http.get<UserModel>(`${this.apiUrl}/me`);
  }

  updateMe(user: Partial<UserModel>): Observable<UserModel> {
    return this.http.put<UserModel>(`${this.apiUrl}/me`, user);
  }
}
