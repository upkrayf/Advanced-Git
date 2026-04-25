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
    this.userService.getStoreCustomers().subscribe({
      next: (data) => {
        this.customers = data.map(u => ({
          id: u.id, userId: u.id, name: u.fullName || u.email, email: u.email,
          city: u.city, totalOrders: u.totalOrders || 0,
          totalSpent: u.totalSpent || 0
        }));
        this.totalElements = data.length;
        this.totalPages = 1;
        this.loading = false;
      },
      error: () => {
        this.customers = [];
        this.loading = false;
      }
    });
  }

  onSearch(): void { this.page = 0; this.load(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
