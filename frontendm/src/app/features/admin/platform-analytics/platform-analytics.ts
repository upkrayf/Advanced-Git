import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { PlatformKpis, RevenuePoint, OrderStatusCount, TopProduct, CategorySales } from '../../../core/models/analytics.model';

@Component({
  selector: 'app-platform-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './platform-analytics.html',
  styleUrl: './platform-analytics.css'
})
export class PlatformAnalytics implements OnInit {
  kpis: PlatformKpis | null = null;
  revenueData: RevenuePoint[] = [];
  orderStatus: OrderStatusCount[] = [];
  topProducts: TopProduct[] = [];
  categorySales: CategorySales[] = [];
  period: 'daily' | 'monthly' | 'yearly' = 'monthly';
  loading = false;

  constructor(private analytics: Analytics) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;

    this.analytics.getPlatformKpis().subscribe({
      next: (d) => { this.kpis = d; this.loading = false; },
      error: () => { this.kpis = null; this.loading = false; }
    });

    this.analytics.getRevenue(this.period).subscribe({
      next: (d) => this.revenueData = d,
      error: () => this.revenueData = [
        { name: 'Eki', value: 45000 }, { name: 'Kas', value: 62000 },
        { name: 'Ara', value: 81000 }, { name: 'Oca', value: 54000 },
        { name: 'Şub', value: 93000 }, { name: 'Mar', value: 110000 },
      ]
    });

    this.analytics.getOrderStatus().subscribe({
      next: (d) => this.orderStatus = d,
      error: () => this.orderStatus = [
        { status: 'DELIVERED', count: 3240 }, { status: 'SHIPPED', count: 810 },
        { status: 'PENDING', count: 298 }, { status: 'CANCELLED', count: 142 },
      ]
    });

    this.analytics.getTopProducts(10).subscribe({
      next: (d) => this.topProducts = d,
      error: () => this.topProducts = []
    });

    this.analytics.getSalesByCategory().subscribe({
      next: (d) => this.categorySales = Array.isArray(d) ? d : [],
      error: () => this.categorySales = [
        { categoryName: 'Elektronik', totalRevenue: 284000, percentage: 42.1 },
        { categoryName: 'Giyim',      totalRevenue: 187000, percentage: 27.7 },
        { categoryName: 'Ev & Yaşam', totalRevenue: 112000, percentage: 16.6 },
        { categoryName: 'Kitap',      totalRevenue:  90000, percentage: 13.3 },
      ]
    });
  }

  changePeriod(p: 'daily' | 'monthly' | 'yearly'): void {
    this.period = p;
    this.analytics.getRevenue(p).subscribe({
      next: (d) => this.revenueData = d,
      error: () => {}
    });
  }

  /** Pixel-based bar height — guarantees correct bottom-up rendering */
  getBarHeightPx(value: number): string {
    if (!this.revenueData.length) return '2px';
    const max = Math.max(...this.revenueData.map(r => +r.value));
    return max > 0 ? `${Math.max(Math.round((+value / max) * 152), 2)}px` : '2px';
  }

  getStatusBarWidth(count: number): string {
    const max = Math.max(...this.orderStatus.map(s => s.count), 1);
    return `${Math.round((count / max) * 100)}%`;
  }

  getStatusColor(status: string): string {
    const c: Record<string, string> = {
      DELIVERED: '#00875a', SHIPPED: '#b76e00', PENDING: '#6c63ff',
      CONFIRMED: '#457b9d', CANCELLED: '#de350b', RETURNED: '#6554c0'
    };
    return c[status] || '#5a5a5a';
  }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = {
      DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', PENDING: 'Beklemede',
      CONFIRMED: 'Onaylandı', CANCELLED: 'İptal', RETURNED: 'İade', PLACED: 'Alındı'
    };
    return l[s] || s;
  }

  /** Category percent — computes from totalRevenue if API sends 0/null */
  getCategoryPercent(cat: CategorySales): string {
    if (cat.percentage != null && +cat.percentage > 0) return (+cat.percentage).toFixed(1);
    const total = this.categorySales.reduce((s, c) => s + (+c.totalRevenue || 0), 0);
    return total > 0 ? ((+cat.totalRevenue / total) * 100).toFixed(1) : '0.0';
  }

  getCategoryPercentNum(cat: CategorySales): number {
    return parseFloat(this.getCategoryPercent(cat));
  }

  getCategoryColor(i: number): string {
    const colors = ['#6c63ff', '#00875a', '#b76e00', '#457b9d', '#de350b', '#6554c0'];
    return colors[i % colors.length];
  }

  getTotalRevenue(): number {
    return this.revenueData.reduce((s, d) => s + (+d.value || 0), 0);
  }

  formatCurrency(v: number): string {
    const n = +v;
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
    return '$' + n.toLocaleString('en-US');
  }
}
