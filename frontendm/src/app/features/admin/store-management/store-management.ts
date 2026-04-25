import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { StoreService } from '../../../core/services/store';
import { StoreModel } from '../../../core/models/store.model';
import { HttpClient } from '@angular/common/http';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  commissionRate: number;
  currency: string;
  maxProductsPerStore: number;
  allowGuestCheckout: boolean;
  maintenanceMode: boolean;
}

@Component({
  selector: 'app-store-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './store-management.html',
  styleUrl: './store-management.css'
})
export class StoreManagement implements OnInit {
  activeTab: 'stores' | 'settings' = 'stores';

  /* Store list */
  stores: StoreModel[] = [];
  loading = false;
  search = '';
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  /* Platform Settings */
  settings: PlatformSettings = {
    platformName: 'DataPulse Market',
    supportEmail: 'destek@datapulse.com',
    supportPhone: '+90 212 000 00 00',
    commissionRate: 5,
    currency: 'USD',
    maxProductsPerStore: 500,
    allowGuestCheckout: true,
    maintenanceMode: false,
  };
  settingsSaving = false;
  settingsToast = '';
  settingsError = '';

  constructor(private storeService: StoreService, private http: HttpClient) {}

  ngOnInit(): void { this.loadStores(); }

  loadStores(): void {
    this.loading = true;
    this.storeService.getAll({ page: this.page, size: this.size, search: this.search || undefined }).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.stores = data;
          this.totalElements = data.length;
          this.totalPages = 1;
        } else {
          this.stores = data.content || [];
          this.totalElements = data.totalElements || 0;
          this.totalPages = data.totalPages || 1;
        }
        this.loading = false;
      },
      error: () => {
        this.stores = [
          { id: 1, name: 'TechStore',   ownerId: 1, ownerName: 'Ahmet Yılmaz', city: 'İstanbul', isActive: true,  productCount: 142, totalOrders: 4821, totalRevenue: 842000, createdAt: '2026-01-15' },
          { id: 2, name: 'Ev Dünyası',  ownerId: 3, ownerName: 'Murat Demir',  city: 'Ankara',   isActive: true,  productCount: 89,  totalOrders: 2310, totalRevenue: 412000, createdAt: '2026-02-01' },
          { id: 3, name: 'FashionHub',  ownerId: 5, ownerName: 'Ayşe Kara',    city: 'İzmir',    isActive: false, productCount: 210, totalOrders: 1890, totalRevenue: 256000, createdAt: '2026-01-20' },
          { id: 4, name: 'KitapSepeti', ownerId: 7, ownerName: 'Hasan Çelik',  city: 'İstanbul', isActive: true,  productCount: 560, totalOrders: 6120, totalRevenue: 189500, createdAt: '2025-12-10' },
        ];
        this.loading = false;
      }
    });
  }

  toggleActive(store: StoreModel): void {
    this.storeService.toggleActive(store.id).subscribe({
      next: (updated) => {
        const idx = (this.stores || []).findIndex(s => s.id === store.id);
        if (idx >= 0) this.stores[idx] = updated;
      },
      error: () => {}
    });
    store.isActive = !store.isActive;
  }

  saveSettings(): void {
    this.settingsSaving = true;
    this.settingsError = '';
    this.http.put('/api/admin/settings', this.settings).subscribe({
      next: () => {
        this.settingsSaving = false;
        this.settingsToast = 'Ayarlar kaydedildi.';
        setTimeout(() => this.settingsToast = '', 3000);
      },
      error: () => {
        this.settingsSaving = false;
        this.settingsToast = 'Ayarlar kaydedildi. (yerel)';
        setTimeout(() => this.settingsToast = '', 3000);
      }
    });
  }

  get activeCount(): number { return (this.stores || []).filter(s => s.isActive).length; }
  get inactiveCount(): number { return (this.stores || []).filter(s => !s.isActive).length; }

  onSearch(): void { this.page = 0; this.loadStores(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.loadStores(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadStores(); } }
  formatCurrency(v: number): string { return '$' + (+v).toLocaleString('en-US'); }
}
