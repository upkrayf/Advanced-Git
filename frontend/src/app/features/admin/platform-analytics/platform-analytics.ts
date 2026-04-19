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
      error: () => {
        this.kpis = { totalUsers: 12430, totalStores: 342, totalOrders: 58920, totalRevenue: 984000, newUsersThisMonth: 1240, newOrdersToday: 183, suspendedAccounts: 23, activeStores: 328 };
        this.loading = false;
      }
    });

    this.analytics.getRevenue(this.period).subscribe({
      next: (d) => this.revenueData = d,
      error: () => this.revenueData = [
        { label: 'Eki', value: 62000 }, { label: 'Kas', value: 75000 },
        { label: 'Ara', value: 88000 }, { label: 'Oca', value: 71000 },
        { label: 'Şub', value: 94000 }, { label: 'Mar', value: 112000 },
      ]
    });

    this.analytics.getOrderStatus().subscribe({
      next: (d) => this.orderStatus = d,
      error: () => this.orderStatus = [
        { status: 'DELIVERED', count: 41200 }, { status: 'SHIPPED', count: 8700 },
        { status: 'PENDING', count: 5100 }, { status: 'CANCELLED', count: 3920 },
      ]
    });

    this.analytics.getTopProducts(10).subscribe({
      next: (d) => this.topProducts = d,
      error: () => this.topProducts = [
        { productId: 1, productName: 'iPhone 15 Pro', totalSold: 1240, revenue: 1487960 },
        { productId: 2, productName: 'Samsung 4K TV', totalSold: 840, revenue: 756000 },
        { productId: 3, productName: 'Nike Air Max', totalSold: 2100, revenue: 378000 },
        { productId: 4, productName: 'MacBook Air', totalSold: 620, revenue: 806000 },
        { productId: 5, productName: 'Sony WH-1000XM5', totalSold: 980, revenue: 352800 },
      ]
    });

    this.analytics.getSalesByCategory().subscribe({
      next: (d) => this.categorySales = d,
      error: () => this.categorySales = [
        { categoryName: 'Elektronik', totalRevenue: 412000, percentage: 41.8 },
        { categoryName: 'Giyim', totalRevenue: 198000, percentage: 20.1 },
        { categoryName: 'Ev & Yaşam', totalRevenue: 146000, percentage: 14.8 },
        { categoryName: 'Kitap', totalRevenue: 89000, percentage: 9.0 },
        { categoryName: 'Spor', totalRevenue: 139000, percentage: 14.1 },
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
