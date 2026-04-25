import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { CorporateKpis, RevenuePoint, TopProduct, CategorySales, OrderStatusCount } from '../../../core/models/analytics.model';

@Component({
  selector: 'app-corporate-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class CorporateAnalytics implements OnInit {
  kpis: CorporateKpis | null = null;
  revenueData: RevenuePoint[] = [];
  topProducts: TopProduct[] = [];
  categorySales: CategorySales[] = [];
  orderStatus: OrderStatusCount[] = [];
  period: 'daily' | 'monthly' | 'yearly' = 'monthly';

  constructor(private analytics: Analytics) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.analytics.getCorporateKpis().subscribe({
      next: (d) => this.kpis = d,
      error: () => this.kpis = { totalRevenue: 284500, ordersToday: 47, avgOrderValue: 142.3, pendingShipments: 23, lowStockItems: 8, totalProducts: 189 }
    });

    this.analytics.getStoreRevenue(this.period).subscribe({
      next: (d) => this.revenueData = d,
      error: () => this.revenueData = [
        { name: 'Eki', value: 18000 }, { name: 'Kas', value: 24000 },
        { name: 'Ara', value: 31000 }, { name: 'Oca', value: 21000 },
        { name: 'Şub', value: 38000 }, { name: 'Mar', value: 42000 },
      ]
    });

    this.analytics.getStoreTopProducts(10).subscribe({
      next: (d) => this.topProducts = d,
      error: () => this.topProducts = [
        { productId: 1, productName: 'iPhone 15 Pro', totalSold: 142, revenue: 170358 },
        { productId: 2, productName: 'AirPods Pro', totalSold: 89, revenue: 22161 },
        { productId: 3, productName: 'iPad Air', totalSold: 67, revenue: 53399 },
        { productId: 4, productName: 'MacBook Air', totalSold: 45, revenue: 58455 },
      ]
    });

    this.analytics.getSalesByCategory().subscribe({
      next: (d) => this.categorySales = d,
      error: () => this.categorySales = [
        { categoryName: 'Telefon', totalRevenue: 142000, percentage: 49.9 },
        { categoryName: 'Aksesuar', totalRevenue: 87000, percentage: 30.6 },
        { categoryName: 'Bilgisayar', totalRevenue: 55500, percentage: 19.5 },
      ]
    });

    this.analytics.getOrderStatus().subscribe({
      next: (d) => this.orderStatus = d,
      error: () => this.orderStatus = [
        { status: 'DELIVERED', count: 1240 }, { status: 'SHIPPED', count: 310 },
        { status: 'PENDING', count: 98 }, { status: 'CANCELLED', count: 42 },
      ]
    });
  }

  changePeriod(p: 'daily' | 'monthly' | 'yearly'): void {
    this.period = p;
    this.analytics.getStoreRevenue(p).subscribe({
      next: (d) => this.revenueData = d,
      error: () => {}
    });
  }

  /** Pixel-based bar height — max 152px, guarantees bottom-up rendering */
  getBarHeightPx(value: number): string {
    if (!this.revenueData.length) return '2px';
    const max = Math.max(...this.revenueData.map(r => +r.value));
    return max > 0 ? `${Math.max(Math.round((+value / max) * 152), 2)}px` : '2px';
  }

  /** Category percentage — computes from totalRevenue if API sends 0 */
  getCategoryPercent(cat: CategorySales): string {
    if (cat.percentage != null && cat.percentage > 0) return (+cat.percentage).toFixed(1);
    const total = this.categorySales.reduce((s, c) => s + (+c.totalRevenue || 0), 0);
    return total > 0 ? ((+cat.totalRevenue / total) * 100).toFixed(1) : '0.0';
  }

  getCategoryPercentNum(cat: CategorySales): number {
    return parseFloat(this.getCategoryPercent(cat));
  }

  getCategoryColor(i: number): string {
    const colors = ['#6c63ff','#00875a','#b76e00','#457b9d','#de350b','#6554c0'];
    return colors[i % colors.length];
  }

  getStatusBarWidth(count: number): string {
    const max = Math.max(...this.orderStatus.map(s => s.count), 1);
    return `${Math.round((count / max) * 100)}%`;
  }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = {
      DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', PENDING: 'Beklemede',
      CONFIRMED: 'Onaylandı', CANCELLED: 'İptal', RETURNED: 'İade', PLACED: 'Alındı'
    };
    return l[s] || s;
  }

  getStatusColor(s: string): string {
    const c: Record<string, string> = {
      DELIVERED: '#00875a', SHIPPED: '#b76e00', PENDING: '#6c63ff',
      CONFIRMED: '#457b9d', CANCELLED: '#de350b', RETURNED: '#6554c0'
    };
    return c[s] || '#5a5a5a';
  }

  getAvgOrderValue(): number {
    if (this.kpis?.avgOrderValue && this.kpis.avgOrderValue > 0) return this.kpis.avgOrderValue;
    const total = this.orderStatus.reduce((s, o) => s + o.count, 0);
    return total > 0 && this.kpis ? this.kpis.totalRevenue / total : 0;
  }

  formatCurrency(v: number): string { return '$' + (+v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
}
