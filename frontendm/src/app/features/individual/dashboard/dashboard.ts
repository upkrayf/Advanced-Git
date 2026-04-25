import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { AiChat } from '../../../shared/components/ai-chat/ai-chat';
import { Analytics } from '../../../core/services/analytics';
import { OrderService } from '../../../core/services/order';
import { UserService } from '../../../core/services/user';
import { IndividualStats, SpendingByCategory } from '../../../core/models/analytics.model';
import { OrderModel } from '../../../core/models/order.model';
import { ShipmentModel } from '../../../core/models/shipment.model';
import { ShipmentService } from '../../../core/services/shipment';
import { Auth } from '../../../core/services/auth';
import { UserModel } from '../../../core/models/user.model';
import { PieChart } from '../../../shared/components/charts/pie-chart/pie-chart';
import { LineChart } from '../../../shared/components/charts/line-chart/line-chart';

@Component({
  selector: 'app-individual-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule, AiChat, PieChart, LineChart],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class IndividualDashboard implements OnInit {
  stats: IndividualStats | null = null;
  spendingByCategory: SpendingByCategory[] = [];
  recentOrders: OrderModel[] = [];
  activeShipments: ShipmentModel[] = [];
  userName = '';
  loading = false;

  // Mock Trend Data
  spendingTrend = [
    {
      name: 'Harcama',
      series: [
        { name: 'Pzt', value: 120 },
        { name: 'Sal', value: 250 },
        { name: 'Çar', value: 180 },
        { name: 'Per', value: 450 },
        { name: 'Cum', value: 320 },
        { name: 'Cmt', value: 600 },
        { name: 'Paz', value: 380 }
      ]
    }
  ];

  categoryData: any[] = [];

  constructor(
    private analytics: Analytics,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
    private userService: UserService,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadStats();
    this.loadOrders();
    this.loadShipments();
    this.loadSpending();
  }

  loadUser(): void {
    this.userService.getMe().subscribe({
      next: (u: UserModel) => this.userName = u.fullName || 'Misafir',
      error: () => this.userName = 'Kullanıcı'
    });
  }

  loadStats(): void {
    this.analytics.getMyStats().subscribe({
      next: (d) => this.stats = d,
      error: () => this.stats = { totalSpent: 0, activeOrders: 0, totalOrders: 0, pendingReviews: 0, savedAmount: 0 }
    });
  }

  loadOrders(): void {
    this.orderService.getMyOrders(0, 4).subscribe({
      next: (d) => this.recentOrders = d.slice(0, 4),
      error: () => this.recentOrders = []
    });
  }

  loadShipments(): void {
    this.shipmentService.getMyShipments().subscribe({
      next: (d) => this.activeShipments = d.slice(0, 3),
      error: () => this.activeShipments = []
    });
  }

  loadSpending(): void {
    this.analytics.getMySpendingByCategory().subscribe({
      next: (d) => {
        this.spendingByCategory = d;
        this.categoryData = d.map(item => ({
          name: item.categoryName,
          value: item.amount
        }));
      },
      error: () => {
        this.spendingByCategory = [];
        this.categoryData = [];
      }
    });
  }

  getMaxSpending(): number {
    return Math.max(...this.spendingByCategory.map(s => s.amount), 1);
  }

  getBarHeight(amount: number): string {
    return `${Math.round((amount / this.getMaxSpending()) * 100)}%`;
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { DELIVERED: 'pill-green', SHIPPED: 'pill-amber', PENDING: 'pill-amber', CANCELLED: 'pill-red' };
    return m[s] || '';
  }
  getStatusLabel(s: string): string {
    const l: Record<string, string> = { DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', PENDING: 'Beklemede', CONFIRMED: 'Onaylandı', CANCELLED: 'İptal' };
    return l[s] || s;
  }
  getShipStatusLabel(s: string): string {
    const l: Record<string, string> = { DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', OUT_FOR_DELIVERY: 'Dağıtımda', PROCESSING: 'Hazırlanıyor', PENDING: 'Beklemede' };
    return l[s] || s;
  }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
