import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  // Backend'deki ilgili API adresi [cite: 178]
  private apiUrl = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient) { }

  // Tüm siparişleri getiren ana metod [cite: 58, 97]
  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}