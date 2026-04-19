import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { UserService } from '../../../core/services/user';
import { CustomerProfileModel } from '../../../core/models/customer-profile.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css'
})
export class Customers implements OnInit {
  customers: CustomerProfileModel[] = [];
  loading = false;
  search = '';
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  constructor(private userService: UserService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.userService.getUsers({ page: this.page, size: this.size, role: 'INDIVIDUAL', search: this.search || undefined }).subscribe({
      next: (data) => {
        this.customers = (data.content as any[]).map(u => ({
          id: u.id, userId: u.id, name: u.name, email: u.email,
          phone: u.phone, city: u.city, totalOrders: u.totalOrders || 0,
          totalSpent: u.totalSpent || 0, createdAt: u.createdAt
        }));
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.loading = false;
      },
      error: () => {
        this.customers = [
          { id: 1, userId: 1, name: 'Zeynep Kaya', email: 'zeynep@gmail.com', phone: '0541 200 3040', city: 'Ankara', totalOrders: 12, totalSpent: 3240, lastOrderDate: '2026-04-10' },
          { id: 2, userId: 2, name: 'Mert Arslan', email: 'mert@mail.com', phone: '0532 110 2020', city: 'İstanbul', totalOrders: 7, totalSpent: 1890, lastOrderDate: '2026-04-09' },
          { id: 3, userId: 3, name: 'Ayşe Demir', email: 'ayse@mail.com', phone: '0555 330 4040', city: 'İzmir', totalOrders: 24, totalSpent: 8750, lastOrderDate: '2026-04-09' },
          { id: 4, userId: 4, name: 'Hasan Öz', email: 'hasan@mail.com', phone: '0542 440 5050', city: 'Bursa', totalOrders: 4, totalSpent: 620, lastOrderDate: '2026-04-08' },
        ];
        this.loading = false;
      }
    });
  }

  onSearch(): void { this.page = 0; this.load(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
