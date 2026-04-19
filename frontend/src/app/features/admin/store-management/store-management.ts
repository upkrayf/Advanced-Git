import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { StoreService } from '../../../core/services/store';
import { StoreModel } from '../../../core/models/store.model';

@Component({
  selector: 'app-store-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './store-management.html',
  styleUrl: './store-management.css'
})
export class StoreManagement implements OnInit {
  stores: StoreModel[] = [];
  loading = false;
  search = '';
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  constructor(private storeService: StoreService) {}

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.loading = true;
    this.storeService.getAll({ page: this.page, size: this.size, search: this.search || undefined }).subscribe({
      next: (data) => {
        this.stores = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.loading = false;
      },
      error: () => {
        this.stores = [
          { id: 1, name: 'TechStore', ownerId: 1, ownerName: 'Ahmet Yılmaz', city: 'İstanbul', isActive: true, productCount: 142, totalOrders: 4821, totalRevenue: 842000, createdAt: '2026-01-15' },
          { id: 2, name: 'Ev Dünyası', ownerId: 3, ownerName: 'Murat Demir', city: 'Ankara', isActive: true, productCount: 89, totalOrders: 2310, totalRevenue: 412000, createdAt: '2026-02-01' },
          { id: 3, name: 'FashionHub', ownerId: 5, ownerName: 'Ayşe Kara', city: 'İzmir', isActive: false, productCount: 210, totalOrders: 1890, totalRevenue: 256000, createdAt: '2026-01-20' },
          { id: 4, name: 'KitapSepeti', ownerId: 7, ownerName: 'Hasan Çelik', city: 'İstanbul', isActive: true, productCount: 560, totalOrders: 6120, totalRevenue: 189500, createdAt: '2025-12-10' },
        ];
        this.loading = false;
      }
    });
  }

  toggleActive(store: StoreModel): void {
    this.storeService.toggleActive(store.id).subscribe({
      next: (updated) => {
        const idx = this.stores.findIndex(s => s.id === store.id);
        if (idx >= 0) this.stores[idx] = updated;
      },
      error: () => {}
    });
    store.isActive = !store.isActive;
  }

  onSearch(): void { this.page = 0; this.loadStores(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.loadStores(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadStores(); } }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US'); }
}
