import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { AuditLog } from '../../../core/models/analytics.model';

const ACTION_COLORS: Record<string, string> = {
  CREATED: '#1d9e75', ADDED: '#1d9e75', PLACED: '#1d9e75', REGISTERED: '#1d9e75',
  DELETED: '#e24b4a', DEACTIVATED: '#e24b4a', SUSPENDED: '#e24b4a', REMOVED: '#e24b4a',
  UPDATED: '#ba7517', CHANGED: '#ba7517', MODIFIED: '#ba7517',
};

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

  /* Filters */
  search = '';
  filterAction = '';
  filterEntity = '';
  dateFrom = '';
  dateTo = '';

  readonly actionTypes = [
    'USER_CREATED','USER_STATUS_CHANGED','USER_DELETED',
    'PRODUCT_ADDED','PRODUCT_UPDATED','PRODUCT_DELETED',
    'ORDER_PLACED','ORDER_STATUS_CHANGED',
    'STORE_ACTIVATED','STORE_DEACTIVATED',
    'CATEGORY_CREATED','CATEGORY_UPDATED','CATEGORY_DELETED',
  ];

  readonly entityTypes = ['User','Product','Order','Store','Category','Review'];

  private mockLogs: AuditLog[] = [
    { id:1,  userId:1, userName:'Admin',        action:'USER_CREATED',        entityType:'User',     entityId:42,   details:'ahmet@shop.com oluşturuldu',      ipAddress:'127.0.0.1',    createdAt:'2026-04-25T08:00:00' },
    { id:2,  userId:2, userName:'Ahmet Yılmaz', action:'PRODUCT_ADDED',       entityType:'Product',  entityId:312,  details:'iPhone 15 Pro eklendi',           ipAddress:'192.168.1.10', createdAt:'2026-04-25T07:45:00' },
    { id:3,  userId:1, userName:'Admin',        action:'STORE_DEACTIVATED',   entityType:'Store',    entityId:3,    details:'FashionHub deaktif edildi',        ipAddress:'127.0.0.1',    createdAt:'2026-04-24T15:20:00' },
    { id:4,  userId:5, userName:'Zeynep Kaya',  action:'ORDER_PLACED',        entityType:'Order',    entityId:1024, details:'Sipariş #1024 oluşturuldu',       ipAddress:'10.0.0.5',     createdAt:'2026-04-24T14:10:00' },
    { id:5,  userId:1, userName:'Admin',        action:'CATEGORY_CREATED',    entityType:'Category', entityId:7,    details:'Bilgisayar kategorisi eklendi',   ipAddress:'127.0.0.1',    createdAt:'2026-04-24T10:30:00' },
    { id:6,  userId:3, userName:'Murat Demir',  action:'USER_STATUS_CHANGED', entityType:'User',     entityId:8,    details:'Kullanıcı askıya alındı',         ipAddress:'192.168.1.22', createdAt:'2026-04-23T16:45:00' },
    { id:7,  userId:1, userName:'Admin',        action:'PRODUCT_DELETED',     entityType:'Product',  entityId:98,   details:'Eski model ürün silindi',         ipAddress:'127.0.0.1',    createdAt:'2026-04-23T11:20:00' },
    { id:8,  userId:4, userName:'Elif Çelik',   action:'ORDER_STATUS_CHANGED',entityType:'Order',    entityId:1018, details:'Sipariş #1018 → SHIPPED',         ipAddress:'10.0.1.3',     createdAt:'2026-04-22T09:15:00' },
    { id:9,  userId:1, userName:'Admin',        action:'USER_CREATED',        entityType:'User',     entityId:55,   details:'mert@corp.com oluşturuldu',       ipAddress:'127.0.0.1',    createdAt:'2026-04-22T08:00:00' },
    { id:10, userId:2, userName:'Ahmet Yılmaz', action:'PRODUCT_UPDATED',     entityType:'Product',  entityId:312,  details:'Fiyat $999 → $1099 güncellendi',  ipAddress:'192.168.1.10', createdAt:'2026-04-21T14:30:00' },
  ];

  constructor(private analytics: Analytics) {}

  ngOnInit(): void { this.loadLogs(); }

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
        this.logs = this.mockLogs;
        this.totalElements = this.mockLogs.length;
        this.totalPages = 1;
        this.loading = false;
      }
    });
  }

  resetFilters(): void {
    this.search = '';
    this.filterAction = '';
    this.filterEntity = '';
    this.dateFrom = '';
    this.dateTo = '';
  }

  get filteredLogs(): AuditLog[] {
    return this.logs.filter(l => {
      if (this.search) {
        const q = this.search.toLowerCase();
        const match = l.action.toLowerCase().includes(q)
          || (l.userName || '').toLowerCase().includes(q)
          || (l.details || '').toLowerCase().includes(q)
          || (l.entityType || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (this.filterAction && l.action !== this.filterAction) return false;
      if (this.filterEntity && l.entityType !== this.filterEntity) return false;
      if (this.dateFrom && l.createdAt < this.dateFrom) return false;
      if (this.dateTo && l.createdAt > this.dateTo + 'T23:59:59') return false;
      return true;
    });
  }

  /* Stats for mini summary cards */
  get statCreated(): number { return this.logs.filter(l => this.isCreate(l.action)).length; }
  get statUpdated(): number { return this.logs.filter(l => this.isUpdate(l.action)).length; }
  get statDeleted(): number { return this.logs.filter(l => this.isDelete(l.action)).length; }
  get statOther():   number { return this.logs.length - this.statCreated - this.statUpdated - this.statDeleted; }

  isCreate(a: string): boolean { return /CREATED|ADDED|PLACED|REGISTERED/.test(a); }
  isUpdate(a: string): boolean { return /UPDATED|CHANGED|MODIFIED/.test(a); }
  isDelete(a: string): boolean { return /DELETED|DEACTIVATED|SUSPENDED|REMOVED/.test(a); }

  getActionColor(action: string): string {
    for (const [key, color] of Object.entries(ACTION_COLORS)) {
      if (action.includes(key)) return color;
    }
    return '#6c63ff';
  }

  getActionIcon(action: string): string {
    if (this.isCreate(action)) return '✚';
    if (this.isDelete(action)) return '✕';
    if (this.isUpdate(action)) return '✎';
    return '●';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString('tr-TR', {
      day: '2-digit', month: 'short', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.loadLogs(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadLogs(); } }
}
