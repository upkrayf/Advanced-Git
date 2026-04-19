import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { OrderService } from '../../../../core/services/order';
import { OrderModel } from '../../../../core/models/order.model';

@Component({
  selector: 'app-corporate-order-detail',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class CorporateOrderDetail implements OnInit {
  order: OrderModel | null = null;
  loading = false;

  constructor(private orderService: OrderService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = +(this.route.snapshot.paramMap.get('id') || 0);
    if (!id) return;
    this.loading = true;
    this.orderService.getOrder(id).subscribe({
      next: (d) => { this.order = d; this.loading = false; },
      error: () => {
        this.order = {
          id, customerName: 'Zeynep Kaya', customerEmail: 'zeynep@gmail.com',
          totalAmount: 499.0, status: 'SHIPPED', shippingAddress: 'Çankaya, Ankara',
          createdAt: '2026-04-10T14:32:00',
          items: [
            { id: 1, productId: 1, productName: 'iPhone 15 Pro', quantity: 1, unitPrice: 1199, subtotal: 1199 },
            { id: 2, productId: 2, productName: 'AirPods Pro', quantity: 1, unitPrice: 249, subtotal: 249 },
          ]
        };
        this.loading = false;
      }
    });
  }

  updateStatus(status: string): void {
    if (!this.order) return;
    this.orderService.updateStatus(this.order.id, status).subscribe({
      next: (d) => { if (this.order) this.order.status = d.status; },
      error: () => {}
    });
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { DELIVERED: 'pill-green', CONFIRMED: 'pill-green', SHIPPED: 'pill-amber', PENDING: 'pill-amber', CANCELLED: 'pill-red', RETURNED: 'pill-red' };
    return m[s] || '';
  }
  getStatusLabel(s: string): string {
    const l: Record<string, string> = { DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', PENDING: 'Beklemede', CONFIRMED: 'Onaylandı', CANCELLED: 'İptal', RETURNED: 'İade' };
    return l[s] || s;
  }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
