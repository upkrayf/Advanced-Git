import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { ShipmentService } from '../../../core/services/shipment';
import { ShipmentModel } from '../../../core/models/shipment.model';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './shipments.html',
  styleUrl: './shipments.css'
})
export class Shipments implements OnInit {
  shipments: ShipmentModel[] = [];
  loading = false;
  selectedStatus = '';
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.shipmentService.getAll({ page: this.page, size: this.size, status: this.selectedStatus || undefined }).subscribe({
      next: (d) => { this.shipments = d.content; this.totalElements = d.totalElements; this.totalPages = d.totalPages; this.loading = false; },
      error: () => {
        this.shipments = [
          { id: 1, orderId: 1024, customerName: 'Zeynep Kaya', trackingNo: 'TRK2839281', carrier: 'PTT Kargo', status: 'SHIPPED', estimatedDelivery: '2026-04-15', createdAt: '2026-04-10' },
          { id: 2, orderId: 1023, customerName: 'Mert Arslan', trackingNo: 'TRK2839182', carrier: 'Aras Kargo', status: 'DELIVERED', actualDelivery: '2026-04-09', createdAt: '2026-04-07' },
          { id: 3, orderId: 1022, customerName: 'Ayşe Demir', trackingNo: 'TRK2839083', carrier: 'MNG Kargo', status: 'PROCESSING', estimatedDelivery: '2026-04-16', createdAt: '2026-04-09' },
          { id: 4, orderId: 1020, customerName: 'Leyla Şen', trackingNo: 'TRK2838984', carrier: 'Yurtiçi', status: 'RETURNED', createdAt: '2026-04-07' },
        ];
        this.loading = false;
      }
    });
  }

  onStatusFilter(): void { this.page = 0; this.load(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { DELIVERED: 'pill-green', SHIPPED: 'pill-amber', OUT_FOR_DELIVERY: 'pill-amber', PROCESSING: 'pill-amber', PENDING: 'pill-amber', RETURNED: 'pill-red', FAILED: 'pill-red' };
    return m[s] || '';
  }
  getStatusLabel(s: string): string {
    const l: Record<string, string> = { DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', OUT_FOR_DELIVERY: 'Dağıtımda', PROCESSING: 'Hazırlanıyor', PENDING: 'Beklemede', RETURNED: 'İade', FAILED: 'Başarısız' };
    return l[s] || s;
  }
}
