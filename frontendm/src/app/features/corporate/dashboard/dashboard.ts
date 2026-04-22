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
      error: () => { this.kpis = null; this.loading = false; }
    });

    this.analytics.getStoreRevenue('monthly').subscribe({
      next: (d) => this.revenueData = d,
      error: () => this.revenueData = []
    });

    this.analytics.getStoreTopProducts(5).subscribe({
      next: (d) => this.topProducts = d,
      error: () => this.topProducts = []
    });

    this.analytics.getOrderStatus().subscribe({
      next: (d) => this.orderStatus = d,
      error: () => this.orderStatus = []
    });

    this.orderService.getOrders({ size: 5 }).subscribe({
      next: (d) => this.recentOrders = d.slice(0, 5),
      error: () => {
        this.recentOrders = []
      }
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
