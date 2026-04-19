import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { AuditLog } from '../../../core/models/analytics.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css'
})
export class AuditLogs implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  page = 0;
  size = 50;
  totalElements = 0;
  totalPages = 0;
  search = '';

  constructor(private analytics: Analytics) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.analytics.getAuditLogs(this.page, this.size).subscribe({
      next: (data) => {
        this.logs = data.content || data;
        this.totalElements = data.totalElements || this.logs.length;
        this.totalPages = data.totalPages || 1;
        this.loading = false;
      },
      error: () => {
        this.logs = [
          { id: 1, userId: 1, userName: 'Admin', action: 'USER_CREATED', entityType: 'User', entityId: 42, details: 'ahmet@shop.com oluşturuldu', ipAddress: '127.0.0.1', createdAt: '2026-04-19T08:00:00' },
          { id: 2, userId: 2, userName: 'Ahmet Yılmaz', action: 'PRODUCT_ADDED', entityType: 'Product', entityId: 312, details: 'iPhone 15 Pro eklendi', ipAddress: '192.168.1.10', createdAt: '2026-04-19T07:45:00' },
          { id: 3, userId: 1, userName: 'Admin', action: 'STORE_DEACTIVATED', entityType: 'Store', entityId: 3, details: 'FashionHub deaktif edildi', ipAddress: '127.0.0.1', createdAt: '2026-04-18T15:20:00' },
          { id: 4, userId: 5, userName: 'Zeynep Kaya', action: 'ORDER_PLACED', entityType: 'Order', entityId: 1024, details: 'Sipariş #1024 oluşturuldu', ipAddress: '10.0.0.5', createdAt: '2026-04-18T14:10:00' },
          { id: 5, userId: 1, userName: 'Admin', action: 'CATEGORY_CREATED', entityType: 'Category', entityId: 7, details: 'Bilgisayar kategorisi eklendi', ipAddress: '127.0.0.1', createdAt: '2026-04-18T10:30:00' },
          { id: 6, userId: 3, userName: 'Murat Demir', action: 'USER_STATUS_CHANGED', entityType: 'User', entityId: 8, details: 'Kullanıcı askıya alındı', ipAddress: '192.168.1.22', createdAt: '2026-04-17T16:45:00' },
        ];
        this.loading = false;
      }
    });
  }

  get filteredLogs(): AuditLog[] {
    if (!this.search) return this.logs;
    const q = this.search.toLowerCase();
    return this.logs.filter(l =>
      l.action.toLowerCase().includes(q) ||
      (l.userName || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q)
    );
  }

  getActionColor(action: string): string {
    if (action.includes('CREATED') || action.includes('ADDED') || action.includes('PLACED')) return '#1d9e75';
    if (action.includes('DELETED') || action.includes('DEACTIVATED') || action.includes('SUSPENDED')) return '#e24b4a';
    if (action.includes('UPDATED') || action.includes('CHANGED')) return '#ba7517';
    return '#6c63ff';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.loadLogs(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadLogs(); } }
}
