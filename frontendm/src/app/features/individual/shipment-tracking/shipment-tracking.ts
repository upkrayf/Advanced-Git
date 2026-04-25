import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { OrderService } from '../../../core/services/order';
import { OrderModel } from '../../../core/models/order.model';

// Teslim/iptal/iade dışındaki tüm durumlar "aktif" sayılır
const ACTIVE_STATUSES = new Set(['PLACED', 'PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'PROCESSING']);

@Component({
  selector: 'app-shipment-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './shipment-tracking.html',
  styleUrl: './shipment-tracking.css'
})
export class ShipmentTracking implements OnInit {
  orders: OrderModel[] = [];
  loading = false;
  trackingInput = '';
  trackResult: string | null = null;
  trackError = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.orderService.getMyOrders().subscribe({
      next: (all) => {
        // Aktif olanları göster; kalan teslim edilenlerden son 3 tanesini de ekle (geçmiş görünümü)
        const active   = all.filter(o => ACTIVE_STATUSES.has(o.status));
        const recent   = all.filter(o => !ACTIVE_STATUSES.has(o.status))
                            .sort((a, b) => b.id - a.id)
                            .slice(0, 3);
        this.orders = [...active, ...recent];
        this.loading = false;
      },
      error: () => {
        // Fallback mock verisi
        this.orders = [
          { id: 1024, totalAmount: 499, status: 'SHIPPED',            createdAt: '2026-04-10', orderNumber: 'ORD-A1B2C3' },
          { id: 1022, totalAmount: 199, status: 'CONFIRMED',           createdAt: '2026-04-09', orderNumber: 'ORD-D4E5F6' },
          { id: 1020, totalAmount: 79,  status: 'PLACED',              createdAt: '2026-04-08', orderNumber: 'ORD-G7H8I9' },
          { id: 1019, totalAmount: 649, status: 'DELIVERED',           createdAt: '2026-04-06', orderNumber: 'ORD-J1K2L3' },
        ];
        this.loading = false;
      }
    });
  }

  trackShipment(): void {
    const q = this.trackingInput.trim().toUpperCase();
    if (!q) return;
    this.trackError = '';
    this.trackResult = null;
    const found = this.orders.find(o =>
      (o.orderNumber || '').toUpperCase().includes(q) ||
      String(o.id) === q
    );
    if (found) {
      this.trackResult = `Sipariş ${found.orderNumber || '#' + found.id}: ${this.getStatusLabel(found.status)}`;
    } else {
      this.trackError = 'Sipariş / takip numarası bulunamadı.';
    }
  }

  getStatusSteps(): string[] {
    return ['Sipariş Alındı', 'Hazırlanıyor', 'Kargoya Verildi', 'Dağıtımda', 'Teslim Edildi'];
  }

  getStepIndex(status: string): number {
    const m: Record<string, number> = {
      PLACED: 0, PENDING: 0,
      PROCESSING: 1, CONFIRMED: 1,
      SHIPPED: 2,
      OUT_FOR_DELIVERY: 3,
      DELIVERED: 4
    };
    return m[status] ?? 0;
  }

  isActive(status: string): boolean { return ACTIVE_STATUSES.has(status); }
  isCancelled(status: string): boolean { return status === 'CANCELLED' || status === 'RETURNED'; }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = {
      PLACED: 'Sipariş Alındı', PENDING: 'Beklemede', CONFIRMED: 'Onaylandı',
      PROCESSING: 'Hazırlanıyor', SHIPPED: 'Kargoda', OUT_FOR_DELIVERY: 'Dağıtımda',
      DELIVERED: 'Teslim Edildi', CANCELLED: 'İptal Edildi', RETURNED: 'İade'
    };
    return l[s] || s;
  }

  getStatusClass(s: string): string {
    if (s === 'DELIVERED') return 'pill-green';
    if (s === 'CANCELLED' || s === 'RETURNED') return 'pill-red';
    return 'pill-amber';
  }

  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
