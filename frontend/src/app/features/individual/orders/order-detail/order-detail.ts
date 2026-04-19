import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { OrderService } from '../../../../core/services/order';
import { OrderModel } from '../../../../core/models/order.model';

@Component({
  selector: 'app-individual-order-detail',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class IndividualOrderDetail implements OnInit {
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
          id, storeName: 'TechStore', totalAmount: 499, status: 'SHIPPED',
          shippingAddress: 'Çankaya, Ankara 06500', createdAt: '2026-04-10T14:32:00',
          items: [
            { id: 1, productId: 1, productName: 'iPhone 15 Pro', quantity: 1, unitPrice: 1199, subtotal: 1199 },
          ]
        };
        this.loading = false;
      }
    });
  }

  getStatusProgress(status: string): number {
    const m: Record<string, number> = { PENDING: 1, CONFIRMED: 2, SHIPPED: 3, OUT_FOR_DELIVERY: 4, DELIVERED: 5, CANCELLED: 0, RETURNED: 0 };
    return m[status] || 0;
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
