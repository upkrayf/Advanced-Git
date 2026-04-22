import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { UserService } from '../../../core/services/user';
import { PlatformKpis, OrderStatusCount, TopProduct } from '../../../core/models/analytics.model';
import { UserModel } from '../../../core/models/user.model';

import { BarChartModule, PieChartModule, LineChartModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule, BarChartModule, PieChartModule, LineChartModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AdminDashboard implements OnInit {
  kpis: PlatformKpis | null = null;
  orderStatus: any[] = [];
  topProducts: any[] = [];
  recentUsers: any[] = [];
  revenueTrend: any[] = [];
  demographics: any[] = [];
  
  loading = true;
  error = '';

  // Chart options
  view: [number, number] = [700, 300];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Month';
  showYAxisLabel = true;
  yAxisLabel = 'Revenue';

  colorScheme: any = {
    domain: ['#1a1a1a', '#36454f', '#5a5a5a', '#8a8a8a']
  };

  constructor(private analytics: Analytics, private userService: UserService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // KPI Data (returning some mock for KPIs not in analytics yet)
    this.analytics.getPlatformKpis().subscribe({
      next: (data) => { this.kpis = data; },
      error: () => { this.kpis = null; }
    });

    this.analytics.getRevenueTrend().subscribe({
      next: (data) => { this.revenueTrend = data; },
      error: () => {}
    });

    this.analytics.getOrderStatus().subscribe({
      next: (data) => {
        this.orderStatus = Object.entries(data).map(([name, value]) => ({ name, value }));
      }
    });

    this.analytics.getTopProducts(5).subscribe({
      next: (data) => { this.topProducts = data; }
    });

    this.analytics.getUserDemographics().subscribe({
      next: (data) => {
        this.demographics = Object.entries(data).map(([name, value]) => ({ name, value }));
      }
    });

    this.userService.getUsers({ page: 0, size: 5 }).subscribe({
      next: (data) => { 
        this.recentUsers = data.content;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda',
      PENDING: 'Beklemede', PLACED: 'Sipariş Alındı',
      CANCELLED: 'İptal', RETURNED: 'İade', 
      CONFIRMED: 'Onaylandı'
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