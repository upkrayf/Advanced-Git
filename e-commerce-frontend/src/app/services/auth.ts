import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // Spring Boot backend adresimiz [cite: 57]

  constructor(private http: HttpClient) {}

  // Mevcut login fonksiyonunu koruyoruz
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Gelen token ve rolü tarayıcı hafızasına kaydediyoruz [cite: 59]
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
      })
    );
  }

  // Yeni Özellik: Kayıt Olma (Proje dökümanındaki register gereksinimi için) [cite: 58]
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Kullanıcının rolünü hızlıca öğrenmek için 
  getRole(): string | null {
    return localStorage.getItem('role') || 'INDIVIDUAL';
  }

  // Yeni Özellik: Token Al (Interceptor veya Chatbot için gerekecek) [cite: 59, 178]
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Yeni Özellik: Giriş Yapılmış mı? (Guard'lar için gerekecek)
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Mevcut logout fonksiyonu
  logout() {
    localStorage.clear();
  }
}