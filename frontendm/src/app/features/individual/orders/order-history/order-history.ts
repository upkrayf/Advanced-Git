import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { OrderService } from '../../../../core/services/order';
import { OrderModel } from '../../../../core/models/order.model';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css'
})
export class OrderHistory implements OnInit {
  orders: OrderModel[] = [];
  loading = false;
  page = 0;
  size = 20;
  totalPages = 0;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.orderService.getMyOrders(this.page, this.size).subscribe({
      next: (d) => { this.orders = d.content; this.totalPages = d.totalPages; this.loading = false; },
      error: () => {
        this.orders = [
          { id: 1024, storeName: 'TechStore', totalAmount: 499, status: 'SHIPPED', createdAt: '2026-04-10' },
          { id: 1019, storeName: 'Ev Dünyası', totalAmount: 120, status: 'DELIVERED', createdAt: '2026-03-25' },
          { id: 1012, storeName: 'FashionHub', totalAmount: 189, status: 'DELIVERED', createdAt: '2026-03-10' },
          { id: 1008, storeName: 'KitapSepeti', totalAmount: 45, status: 'DELIVERED', createdAt: '2026-02-28' },
          { id: 1001, storeName: 'TechStore', totalAmount: 2399, status: 'CANCELLED', createdAt: '2026-02-15' },
        ];
        this.loading = false;
      }
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
  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }
}
