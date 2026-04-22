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

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;

    this.analytics.getPlatformKpis().subscribe({
      next: (d) => { this.kpis = d; this.loading = false; },
      error: () => { this.kpis = null; this.loading = false; }
    });

    this.analytics.getRevenue(this.period).subscribe({
      next: (d) => this.revenueData = d,
      error: () => this.revenueData = []
    });

    this.analytics.getOrderStatus().subscribe({
      next: (d) => this.orderStatus = d,
      error: () => this.orderStatus = []
    });

    this.analytics.getTopProducts(10).subscribe({
      next: (d) => this.topProducts = d,
      error: () => this.topProducts = []
    });

    this.analytics.getSalesByCategory().subscribe({
      next: (d) => this.categorySales = d,
      error: () => this.categorySales = []
    });
  }

  changePeriod(p: 'daily' | 'monthly' | 'yearly'): void {
    this.period = p;
    this.analytics.getRevenue(p).subscribe({
      next: (d) => this.revenueData = d,
      error: () => {}
    });
  }

  getBarHeight(value: number): string {
    if (!this.revenueData.length) return '0%';
    const max = Math.max(...this.revenueData.map(r => r.value));
    return max > 0 ? `${Math.round((value / max) * 100)}%` : '0%';
  }

  formatCurrency(v: number): string {
    return v >= 1000000 ? '$' + (v / 1000000).toFixed(1) + 'M'
      : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K'
      : '$' + v;
  }

  getTotalRevenue(): number {
    return this.revenueData.reduce((s, d) => s + d.value, 0);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = { DELIVERED: '#1d9e75', SHIPPED: '#ba7517', PENDING: '#6c63ff', CANCELLED: '#e24b4a', RETURNED: '#378add' };
    return colors[status] || '#7a7a9a';
  }
}
