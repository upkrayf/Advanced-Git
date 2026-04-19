import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShipmentModel, ShipmentPageResponse } from '../models/shipment.model';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private apiUrl = '/api/shipments';

  constructor(private http: HttpClient) {}

  getAll(params?: { page?: number; size?: number; status?: string; storeId?: number }): Observable<ShipmentPageResponse> {
    let p = new HttpParams();
    if (params?.page !== undefined) p = p.set('page', params.page);
    if (params?.size !== undefined) p = p.set('size', params.size);
    if (params?.status) p = p.set('status', params.status);
    if (params?.storeId) p = p.set('storeId', params.storeId);
    return this.http.get<ShipmentPageResponse>(this.apiUrl, { params: p });
  }

  getShipment(id: number): Observable<ShipmentModel> {
    return this.http.get<ShipmentModel>(`${this.apiUrl}/${id}`);
  }

  getByOrder(orderId: number): Observable<ShipmentModel> {
    return this.http.get<ShipmentModel>(`${this.apiUrl}/order/${orderId}`);
  }

  track(trackingNo: string): Observable<ShipmentModel> {
    return this.http.get<ShipmentModel>(`${this.apiUrl}/track/${trackingNo}`);
  }

  getMyShipments(): Observable<ShipmentModel[]> {
    return this.http.get<ShipmentModel[]>(`${this.apiUrl}/my`);
  }
}
