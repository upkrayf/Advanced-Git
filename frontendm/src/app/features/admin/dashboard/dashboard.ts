import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { UserService } from '../../../core/services/user';
import { PlatformKpis, OrderStatusCount } from '../../../core/models/analytics.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AdminDashboard implements OnInit {
  kpis: PlatformKpis | null = null;
  orderStatus: OrderStatusCount[] = [];
  topProducts: any[] = [];
  recentUsers: any[] = [];
  revenueTrend: any[] = [];
  demographics: any[] = [];
  loading = true;

  constructor(private analytics: Analytics, private userService: UserService) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;

    this.analytics.getPlatformKpis().subscribe({
      next: (d) => { this.kpis = d; },
      error: () => { this.kpis = null; }
    });

    this.analytics.getRevenueTrend().subscribe({
      next: (d) => { this.revenueTrend = d; },
      error: () => { this.revenueTrend = [
        { name: 'Eki', value: 45000 }, { name: 'Kas', value: 62000 },
        { name: 'Ara', value: 81000 }, { name: 'Oca', value: 54000 },
        { name: 'Şub', value: 93000 }, { name: 'Mar', value: 110000 },
      ]; }
    });

    this.analytics.getOrderStatus().subscribe({
      next: (d) => { this.orderStatus = d; },
      error: () => { this.orderStatus = []; }
    });

    this.analytics.getTopProducts(5).subscribe({
      next: (d) => { this.topProducts = d; },
      error: () => { this.topProducts = []; }
    });

    this.analytics.getUserDemographics().subscribe({
      next: (d) => {
        this.demographics = Object.entries(d).map(([name, value]) => ({ name, value }));
      },
      error: () => { this.demographics = []; }
    });

    this.userService.getUsers({ page: 0, size: 5 }).subscribe({
      next: (d) => { this.recentUsers = d.content; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  /** Pixel-based height for bar chart (max 152px) */
  getBarHeightPx(value: number, data: any[]): string {
    if (!data.length) return '2px';
    const max = Math.max(...data.map((d: any) => +(d.value ?? 0)));
    return max > 0 ? `${Math.max(Math.round((+value / max) * 152), 2)}px` : '2px';
  }

  getStatusBarWidth(count: number): string {
    const max = Math.max(...this.orderStatus.map(s => s.count), 1);
    return `${Math.round((count / max) * 100)}%`;
  }

  getDemoPercent(value: number): number {
    const total = this.demographics.reduce((s: number, d: any) => s + +d.value, 0);
    return total > 0 ? Math.round((+value / total) * 100) : 0;
  }

  getDemoColor(name: string): string {
    const colors: Record<string, string> = {
      MALE: '#457b9d', FEMALE: '#b5838d', OTHER: '#6554c0',
      ADMIN: '#de350b', CORPORATE: '#00875a', INDIVIDUAL: '#6c63ff'
    };
    return colors[name?.toUpperCase()] || '#5a5a5a';
  }

  getStatusColor(status: string): string {
    const c: Record<string, string> = {
      DELIVERED: '#00875a', SHIPPED: '#b76e00', PENDING: '#6c63ff',
      CONFIRMED: '#457b9d', CANCELLED: '#de350b', RETURNED: '#6554c0', PLACED: '#457b9d'
    };
    return c[status] || '#5a5a5a';
  }

  getStatusLabel(status: string): string {
    const l: Record<string, string> = {
      DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', PENDING: 'Beklemede',
      PLACED: 'Sipariş Alındı', CANCELLED: 'İptal', RETURNED: 'İade', CONFIRMED: 'Onaylandı'
    };
    return l[status] || status;
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = {
      DELIVERED: 'pill-green', CONFIRMED: 'pill-green',
      SHIPPED: 'pill-amber', PENDING: 'pill-amber', PLACED: 'pill-amber',
      CANCELLED: 'pill-red', RETURNED: 'pill-red'
    };
    return m[status] || '';
  }

  formatCurrency(val: number): string {
    const v = +val;
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000) return '$' + (v / 1_000).toFixed(0) + 'K';
    return '$' + v.toLocaleString('en-US');
  }
}
