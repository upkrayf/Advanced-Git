import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { ShipmentService } from '../../../core/services/shipment';
import { ShipmentModel } from '../../../core/models/shipment.model';

@Component({
  selector: 'app-shipment-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './shipment-tracking.html',
  styleUrl: './shipment-tracking.css'
})
export class ShipmentTracking implements OnInit {
  shipments: ShipmentModel[] = [];
  loading = false;
  trackingInput = '';
  trackedShipment: ShipmentModel | null = null;
  trackError = '';

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.shipmentService.getMyShipments().subscribe({
      next: (d) => { this.shipments = d; this.loading = false; },
      error: () => {
        this.shipments = [
          { id: 1, orderId: 1024, trackingNo: 'TRK2839281', carrier: 'PTT Kargo', status: 'SHIPPED', estimatedDelivery: '2026-04-15', shippingAddress: 'Çankaya, Ankara' },
          { id: 2, orderId: 1019, trackingNo: 'TRK2839182', carrier: 'Aras Kargo', status: 'DELIVERED', actualDelivery: '2026-04-06', shippingAddress: 'Çankaya, Ankara' },
        ];
        this.loading = false;
      }
    });
  }

  trackShipment(): void {
    if (!this.trackingInput.trim()) return;
    this.trackError = '';
    this.shipmentService.track(this.trackingInput.trim()).subscribe({
      next: (d) => this.trackedShipment = d,
      error: () => { this.trackError = 'Takip numarası bulunamadı.'; this.trackedShipment = null; }
    });
  }

  getStatusSteps(): string[] {
    return ['Sipariş Alındı', 'Hazırlanıyor', 'Kargoya Verildi', 'Dağıtımda', 'Teslim Edildi'];
  }

  getStepIndex(status: string): number {
    const m: Record<string, number> = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4 };
    return m[status] ?? -1;
  }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = { DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', OUT_FOR_DELIVERY: 'Dağıtımda', PROCESSING: 'Hazırlanıyor', PENDING: 'Beklemede', RETURNED: 'İade' };
    return l[s] || s;
  }
  getStatusClass(s: string): string {
    const m: Record<string, string> = { DELIVERED: 'pill-green', SHIPPED: 'pill-amber', OUT_FOR_DELIVERY: 'pill-amber', PROCESSING: 'pill-amber', PENDING: 'pill-amber', RETURNED: 'pill-red' };
    return m[s] || '';
  }
}
