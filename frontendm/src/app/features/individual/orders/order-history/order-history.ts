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

  sortColumn = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';

  get sortedOrders(): OrderModel[] {
    return [...this.orders].sort((a, b) => {
      const av = (a as any)[this.sortColumn] ?? '';
      const bv = (b as any)[this.sortColumn] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  constructor(private orderService: OrderService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.orderService.getMyOrders(this.page, this.size).subscribe({
      next: (d) => { this.orders = d; this.totalPages = 1; this.loading = false; },
      error: () => {
        this.orders = [
          { id: 1024, orderNumber: 'ORD-9654AF38', storeName: 'TechStore', totalAmount: 499, status: 'SHIPPED', createdAt: '2026-04-10' },
          { id: 1019, orderNumber: 'ORD-F0E9A952', storeName: 'Ev Dünyası', totalAmount: 120, status: 'DELIVERED', createdAt: '2026-03-25' },
          { id: 1012, orderNumber: 'ORD-B3C12DE1', storeName: 'FashionHub', totalAmount: 189, status: 'DELIVERED', createdAt: '2026-03-10' },
        ];
        this.loading = false;
      }
    });
  }

  sort(col: string): void {
    if (this.sortColumn === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDir = 'asc';
    }
  }

  getSortIcon(col: string): string {
    if (this.sortColumn !== col) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { DELIVERED: 'pill-green', CONFIRMED: 'pill-green', PLACED: 'pill-amber', SHIPPED: 'pill-amber', PENDING: 'pill-amber', CANCELLED: 'pill-red', RETURNED: 'pill-red' };
    return m[s] || '';
  }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = { DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', PENDING: 'Beklemede', PLACED: 'Alındı', CONFIRMED: 'Onaylandı', CANCELLED: 'İptal', RETURNED: 'İade' };
    return l[s] || s;
  }

  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }
}
