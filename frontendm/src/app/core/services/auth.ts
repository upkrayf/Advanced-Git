import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthResponse } from '../models/auth-response.model';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = '/api/auth';

  constructor(private router: Router, private http: HttpClient) { }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => this.setSession(response)),
      map(response => {
        this.navigateByRole(response.roleType);
        return true;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean { return this.getRole() === 'ADMIN'; }
  isCorporate(): boolean { return this.getRole() === 'CORPORATE'; }
  isIndividual(): boolean { return this.getRole() === 'INDIVIDUAL'; }

  private setSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('role', response.roleType ?? 'INDIVIDUAL');
  }

  private navigateByRole(role: string | null): void {
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'CORPORATE':
        this.router.navigate(['/corporate/dashboard']);
        break;
      default:
        this.router.navigate(['/individual/dashboard']);
    }
  }
}
