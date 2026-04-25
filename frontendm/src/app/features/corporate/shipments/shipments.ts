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
  search = '';
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  private mockData: ShipmentModel[] = [
    { id: 1, orderId: 1024, customerName: 'Zeynep Kaya',  trackingNo: 'TRK2839281', carrier: 'PTT Kargo',  status: 'SHIPPED',     estimatedDelivery: '2026-04-27', createdAt: '2026-04-23' },
    { id: 2, orderId: 1023, customerName: 'Mert Arslan',  trackingNo: 'TRK2839182', carrier: 'Aras Kargo', status: 'DELIVERED',    actualDelivery: '2026-04-22',    createdAt: '2026-04-20' },
    { id: 3, orderId: 1022, customerName: 'Ayşe Demir',   trackingNo: 'TRK2839083', carrier: 'MNG Kargo',  status: 'PROCESSING',   estimatedDelivery: '2026-04-28', createdAt: '2026-04-23' },
    { id: 4, orderId: 1020, customerName: 'Leyla Şen',    trackingNo: 'TRK2838984', carrier: 'Yurtiçi',    status: 'RETURNED',     createdAt: '2026-04-18' },
    { id: 5, orderId: 1019, customerName: 'Ahmet Yıldız', trackingNo: 'TRK2838885', carrier: 'PTT Kargo',  status: 'OUT_FOR_DELIVERY', estimatedDelivery: '2026-04-25', createdAt: '2026-04-22' },
    { id: 6, orderId: 1018, customerName: 'Elif Çelik',   trackingNo: 'TRK2838786', carrier: 'Aras Kargo', status: 'DELIVERED',    actualDelivery: '2026-04-21',    createdAt: '2026-04-19' },
  ];

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.shipmentService.getAll({
      page: this.page,
      size: this.size,
      status: this.selectedStatus || undefined
    }).subscribe({
      next: (d) => {
        this.shipments = d.content;
        this.totalElements = d.totalElements;
        this.totalPages = d.totalPages;
        this.loading = false;
      },
      error: () => {
        this.shipments = this.mockData;
        this.totalElements = this.mockData.length;
        this.totalPages = 1;
        this.loading = false;
      }
    });
  }

  get filtered(): ShipmentModel[] {
    if (!this.search) return this.shipments;
    const q = this.search.toLowerCase();
    return this.shipments.filter(s =>
      (s.trackingNo || '').toLowerCase().includes(q) ||
      (s.customerName || '').toLowerCase().includes(q) ||
      (s.carrier || '').toLowerCase().includes(q)
    );
  }

  get totalCount(): number { return this.shipments.length; }
  get inTransitCount(): number { return this.shipments.filter(s => ['SHIPPED','OUT_FOR_DELIVERY','PROCESSING'].includes(s.status)).length; }
  get deliveredCount(): number { return this.shipments.filter(s => s.status === 'DELIVERED').length; }
  get returnedCount(): number { return this.shipments.filter(s => s.status === 'RETURNED').length; }

  onStatusFilter(): void { this.page = 0; this.load(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      DELIVERED: 'pill-green', SHIPPED: 'pill-amber', OUT_FOR_DELIVERY: 'pill-amber',
      PROCESSING: 'pill-amber', PENDING: 'pill-amber', RETURNED: 'pill-red', FAILED: 'pill-red'
    };
    return m[s] || '';
  }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = {
      DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', OUT_FOR_DELIVERY: 'Dağıtımda',
      PROCESSING: 'Hazırlanıyor', PENDING: 'Beklemede', RETURNED: 'İade', FAILED: 'Başarısız'
    };
    return l[s] || s;
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      DELIVERED: '✅', SHIPPED: '📦', OUT_FOR_DELIVERY: '🚚',
      PROCESSING: '⚙️', PENDING: '⏳', RETURNED: '↩️', FAILED: '❌'
    };
    return m[s] || '📋';
  }
}
