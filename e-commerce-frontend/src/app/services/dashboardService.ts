import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api/analytics';

  constructor(private http: HttpClient) { }

  // KPI kartları için (Revenue, Orders, Customers, Rating)
  getSummaryStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/summary`);
  }

  // Grafik verileri için
  getRevenueData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/revenue-chart`);
  }
}