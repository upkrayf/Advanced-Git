import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { OrderService } from '../../../core/services/order';
import { CorporateKpis, RevenuePoint, TopProduct, OrderStatusCount } from '../../../core/models/analytics.model';
import { OrderModel } from '../../../core/models/order.model';

@Component({
  selector: 'app-corporate-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class CorporateDashboard implements OnInit {
  kpis: CorporateKpis | null = null;
  revenueData: RevenuePoint[] = [];
  topProducts: TopProduct[] = [];
  orderStatus: OrderStatusCount[] = [];
  recentOrders: OrderModel[] = [];
  loading = false;

  constructor(private analytics: Analytics, private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.analytics.getCorporateKpis().subscribe({
      next: (d) => { this.kpis = d; this.loading = false; },
      error: () => {
        this.kpis = { totalRevenue: 284500, ordersToday: 47, avgOrderValue: 142.3, pendingShipments: 23, lowStockItems: 8, totalProducts: 189 };
        this.loading = false;
      }
    });

    this.analytics.getStoreRevenue('monthly').subscribe({
      next: (d) => this.revenueData = d,
      error: () => this.revenueData = [
        { label: 'Eki', value: 18000 }, { label: 'Kas', value: 24000 },
        { label: 'Ara', value: 31000 }, { label: 'Oca', value: 21000 },
        { label: 'Şub', value: 38000 }, { label: 'Mar', value: 42000 },
      ]
    });

    this.analytics.getStoreTopProducts(5).subscribe({
      next: (d) => this.topProducts = d,
      error: () => this.topProducts = [
        { productId: 1, productName: 'iPhone 15 Pro', totalSold: 142, revenue: 170358 },
        { productId: 2, productName: 'AirPods Pro', totalSold: 89, revenue: 22161 },
        { productId: 3, productName: 'iPad Air', totalSold: 67, revenue: 53399 },
      ]
    });

    this.analytics.getOrderStatus().subscribe({
      next: (d) => this.orderStatus = d,
      error: () => this.orderStatus = [
        { status: 'DELIVERED', count: 1240 }, { status: 'SHIPPED', count: 310 },
        { status: 'PENDING', count: 98 }, { status: 'CANCELLED', count: 42 },
      ]
    });

    this.orderService.getOrders({ page: 0, size: 5 }).subscribe({
      next: (d) => this.recentOrders = d.content,
      error: () => this.recentOrders = [
        { id: 1024, customerName: 'Zeynep Kaya', totalAmount: 499.0, status: 'SHIPPED', createdAt: '2026-04-10' },
        { id: 1023, customerName: 'Mert Arslan', totalAmount: 129.9, status: 'DELIVERED', createdAt: '2026-04-09' },
        { id: 1022, customerName: 'Ayşe Demir', totalAmount: 2199.0, status: 'PENDING', createdAt: '2026-04-09' },
        { id: 1021, customerName: 'Hasan Öz', totalAmount: 79.9, status: 'DELIVERED', createdAt: '2026-04-08' },
      ]
    });
  }

  getBarHeight(value: number): string {
    if (!this.revenueData.length) return '0%';
    const max = Math.max(...this.revenueData.map(r => r.value));
    return max > 0 ? `${Math.round((value / max) * 100)}%` : '0%';
  }

  getStatusColor(status: string): string {
    const c: Record<string, string> = { DELIVERED: '#1d9e75', SHIPPED: '#ba7517', PENDING: '#6c63ff', CANCELLED: '#e24b4a' };
    return c[status] || '#7a7a9a';
  }

  getStatusClass(status: string): string {
    const c: Record<string, string> = { DELIVERED: 'pill-green', SHIPPED: 'pill-amber', CONFIRMED: 'pill-amber', PENDING: 'pill-amber', CANCELLED: 'pill-red', RETURNED: 'pill-red' };
    return c[status] || '';
  }

  getStatusLabel(status: string): string {
    const l: Record<string, string> = { DELIVERED: 'Teslim', SHIPPED: 'Kargoda', PENDING: 'Beklemede', CONFIRMED: 'Onaylandı', CANCELLED: 'İptal', RETURNED: 'İade' };
    return l[status] || status;
  }

  formatCurrency(v: number): string {
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
