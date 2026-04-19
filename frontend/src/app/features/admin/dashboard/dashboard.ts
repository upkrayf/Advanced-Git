import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { UserService } from '../../../core/services/user';
import { PlatformKpis, OrderStatusCount, TopProduct } from '../../../core/models/analytics.model';
import { UserModel } from '../../../core/models/user.model';

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
  topProducts: TopProduct[] = [];
  recentUsers: UserModel[] = [];
  revenueData: { label: string; value: number }[] = [];
  loading = true;
  error = '';

  constructor(private analytics: Analytics, private userService: UserService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.analytics.getPlatformKpis().subscribe({
      next: (data) => { this.kpis = data; this.loading = false; },
      error: () => {
        this.kpis = {
          totalUsers: 12430, totalStores: 342, totalOrders: 58920,
          totalRevenue: 984000, newUsersThisMonth: 1240, newOrdersToday: 183,
          suspendedAccounts: 23, activeStores: 328
        };
        this.loading = false;
      }
    });

    this.analytics.getRevenue('monthly').subscribe({
      next: (data) => { this.revenueData = data; },
      error: () => {
        this.revenueData = [
          { label: 'Eki', value: 62000 }, { label: 'Kas', value: 75000 },
          { label: 'Ara', value: 88000 }, { label: 'Oca', value: 71000 },
          { label: 'Şub', value: 94000 }, { label: 'Mar', value: 112000 },
        ];
      }
    });

    this.analytics.getOrderStatus().subscribe({
      next: (data) => { this.orderStatus = data; },
      error: () => {
        this.orderStatus = [
          { status: 'DELIVERED', count: 41200 }, { status: 'SHIPPED', count: 8700 },
          { status: 'PENDING', count: 5100 }, { status: 'CANCELLED', count: 3920 },
        ];
      }
    });

    this.analytics.getTopProducts(5).subscribe({
      next: (data) => { this.topProducts = data; },
      error: () => {
        this.topProducts = [
          { productId: 1, productName: 'iPhone 15 Pro', totalSold: 1240, revenue: 1487960 },
          { productId: 2, productName: 'Samsung 4K TV', totalSold: 840, revenue: 756000 },
          { productId: 3, productName: 'Nike Air Max', totalSold: 2100, revenue: 378000 },
          { productId: 4, productName: 'MacBook Air', totalSold: 620, revenue: 806000 },
          { productId: 5, productName: 'Sony WH-1000XM5', totalSold: 980, revenue: 352800 },
        ];
      }
    });

    this.userService.getUsers({ page: 0, size: 5 }).subscribe({
      next: (data) => { this.recentUsers = data.content; },
      error: () => {
        this.recentUsers = [
          { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@techstore.com', roleType: 'CORPORATE', isActive: true, createdAt: '2026-03-12' },
          { id: 2, name: 'Zeynep Kaya', email: 'zeynep@gmail.com', roleType: 'INDIVIDUAL', isActive: true, createdAt: '2026-03-28' },
          { id: 3, name: 'Murat Demir', email: 'murat@shop.com', roleType: 'CORPORATE', isActive: false, createdAt: '2026-04-02' },
          { id: 4, name: 'Elif Şahin', email: 'elif@hotmail.com', roleType: 'INDIVIDUAL', isActive: false, createdAt: '2026-04-05' },
        ];
      }
    });
  }

  getBarHeight(value: number): string {
    if (!this.revenueData.length) return '0%';
    const max = Math.max(...this.revenueData.map(r => r.value));
    return max > 0 ? `${Math.round((value / max) * 100)}%` : '0%';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda',
      PENDING: 'Beklemede', CONFIRMED: 'Onaylandı',
      CANCELLED: 'İptal', RETURNED: 'İade'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      DELIVERED: 'pill-green', CONFIRMED: 'pill-green',
      SHIPPED: 'pill-amber', PENDING: 'pill-amber',
      CANCELLED: 'pill-red', RETURNED: 'pill-red'
    };
    return map[status] || '';
  }

  formatCurrency(val: number): string {
    return '$' + val.toLocaleString('en-US');
  }
}