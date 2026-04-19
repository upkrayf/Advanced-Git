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

@Component({
  selector: 'app-individual-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule, AiChat],
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

  constructor(
    private analytics: Analytics,
    private orderService: OrderService,
    private shipmentService: ShipmentService,
    private userService: UserService
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
      next: (u) => this.userName = u.name,
      error: () => this.userName = 'Kullanıcı'
    });
  }

  loadStats(): void {
    this.analytics.getMyStats().subscribe({
      next: (d) => this.stats = d,
      error: () => this.stats = { totalSpent: 3240, activeOrders: 2, totalOrders: 18, pendingReviews: 3, savedAmount: 185 }
    });
  }

  loadOrders(): void {
    this.orderService.getMyOrders(0, 4).subscribe({
      next: (d) => this.recentOrders = d.content,
      error: () => this.recentOrders = [
        { id: 1024, storeName: 'TechStore', totalAmount: 499, status: 'SHIPPED', createdAt: '2026-04-10' },
        { id: 1019, storeName: 'Ev Dünyası', totalAmount: 120, status: 'DELIVERED', createdAt: '2026-03-25' },
      ]
    });
  }

  loadShipments(): void {
    this.shipmentService.getMyShipments().subscribe({
      next: (d) => this.activeShipments = d.slice(0, 3),
      error: () => this.activeShipments = [
        { id: 1, orderId: 1024, trackingNo: 'TRK2839281', carrier: 'PTT', status: 'SHIPPED', estimatedDelivery: '2026-04-15' },
        { id: 2, orderId: 1019, status: 'DELIVERED', actualDelivery: '2026-04-06' },
      ]
    });
  }

  loadSpending(): void {
    this.analytics.getMySpendingByCategory().subscribe({
      next: (d) => this.spendingByCategory = d,
      error: () => this.spendingByCategory = [
        { categoryName: 'Elektronik', amount: 1890 },
        { categoryName: 'Giyim', amount: 640 },
        { categoryName: 'Ev & Yaşam', amount: 480 },
        { categoryName: 'Kitap', amount: 230 },
      ]
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
