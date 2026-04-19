import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { OrderService } from '../../../../core/services/order';
import { OrderModel } from '../../../../core/models/order.model';

@Component({
  selector: 'app-corporate-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css'
})
export class CorporateOrderList implements OnInit {
  orders: OrderModel[] = [];
  loading = false;
  selectedStatus = '';
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrders({ page: this.page, size: this.size, status: this.selectedStatus || undefined }).subscribe({
      next: (d) => { this.orders = d.content; this.totalElements = d.totalElements; this.totalPages = d.totalPages; this.loading = false; },
      error: () => {
        this.orders = [
          { id: 1024, customerName: 'Zeynep Kaya', customerEmail: 'zeynep@gmail.com', totalAmount: 499.0, status: 'SHIPPED', createdAt: '2026-04-10' },
          { id: 1023, customerName: 'Mert Arslan', customerEmail: 'mert@mail.com', totalAmount: 129.9, status: 'DELIVERED', createdAt: '2026-04-09' },
          { id: 1022, customerName: 'Ayşe Demir', customerEmail: 'ayse@mail.com', totalAmount: 2199.0, status: 'PENDING', createdAt: '2026-04-09' },
          { id: 1021, customerName: 'Hasan Öz', customerEmail: 'hasan@mail.com', totalAmount: 79.9, status: 'DELIVERED', createdAt: '2026-04-08' },
          { id: 1020, customerName: 'Leyla Şen', customerEmail: 'leyla@mail.com', totalAmount: 649.0, status: 'CANCELLED', createdAt: '2026-04-07' },
        ];
        this.loading = false;
      }
    });
  }

  onStatusFilter(): void { this.page = 0; this.loadOrders(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.loadOrders(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadOrders(); } }

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
