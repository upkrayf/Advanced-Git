import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { OrderService } from '../../../core/services/order';
import { CorporateKpis, RevenuePoint, TopProduct, OrderStatusCount } from '../../../core/models/analytics.model';
import { OrderModel } from '../../../core/models/order.model';

const PENDING_STATUSES = new Set(['PLACED', 'PENDING', 'CONFIRMED', 'PROCESSING']);
const SHIPPED_STATUSES = new Set(['SHIPPED', 'OUT_FOR_DELIVERY']);

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

  ngOnInit(): void { this.loadData(); }

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
      error: () => this.recentOrders = []
    });
  }

  /** AOV: kpis.avgOrderValue → fallback: revenue / delivered orders */
  getAvgOrderValue(): number {
    if (this.kpis?.avgOrderValue && this.kpis.avgOrderValue > 0) return this.kpis.avgOrderValue;
    const delivered = this.orderStatus.filter(s => s.status === 'DELIVERED').reduce((s, o) => s + o.count, 0);
    if (delivered > 0 && this.kpis) return this.kpis.totalRevenue / delivered;
    const total = this.orderStatus.reduce((s, o) => s + o.count, 0);
    return total > 0 && this.kpis ? this.kpis.totalRevenue / total : 0;
  }

  getPendingCount(): number {
    if (this.kpis?.pendingShipments != null && this.kpis.pendingShipments > 0) return this.kpis.pendingShipments;
    return this.orderStatus
      .filter(s => PENDING_STATUSES.has(s.status) || SHIPPED_STATUSES.has(s.status))
      .reduce((s, o) => s + o.count, 0);
  }

  /** Returns a pixel-based height string for the bar chart (max=152px to leave room) */
  getBarHeightPx(value: number): string {
    if (!this.revenueData.length) return '2px';
    const max = Math.max(...this.revenueData.map(r => +r.value));
    return max > 0 ? `${Math.max(Math.round((value / max) * 152), 2)}px` : '2px';
  }

  getStatusBarWidth(count: number): string {
    const max = Math.max(...this.orderStatus.map(s => s.count), 1);
    return `${Math.round((count / max) * 100)}%`;
  }

  getStatusColor(status: string): string {
    const c: Record<string, string> = {
      DELIVERED: '#00875a', SHIPPED: '#b76e00', PENDING: '#6c63ff',
      CONFIRMED: '#457b9d', CANCELLED: '#de350b', RETURNED: '#6554c0',
      PLACED: '#457b9d', PROCESSING: '#b76e00', OUT_FOR_DELIVERY: '#b76e00'
    };
    return c[status] || '#5a5a5a';
  }

  getStatusClass(status: string): string {
    const c: Record<string, string> = {
      DELIVERED: 'pill-green', SHIPPED: 'pill-amber', CONFIRMED: 'pill-amber',
      PENDING: 'pill-amber', PLACED: 'pill-amber', CANCELLED: 'pill-red', RETURNED: 'pill-red'
    };
    return c[status] || '';
  }

  getStatusLabel(status: string): string {
    const l: Record<string, string> = {
      DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', PENDING: 'Beklemede',
      CONFIRMED: 'Onaylandı', CANCELLED: 'İptal', RETURNED: 'İade',
      PLACED: 'Alındı', PROCESSING: 'Hazırlanıyor', OUT_FOR_DELIVERY: 'Dağıtımda'
    };
    return l[status] || status;
  }

  formatCurrency(v: number): string {
    return '$' + (+v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
