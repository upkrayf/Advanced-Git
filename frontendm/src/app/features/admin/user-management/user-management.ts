import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { UserService } from '../../../core/services/user';
import { UserModel, CreateUserRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  users: UserModel[] = [];
  loading = false;
  error = '';
  search = '';
  selectedRole = '';
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  showCreateModal = false;
  newUser: CreateUserRequest = { name: '', email: '', password: '', roleType: 'INDIVIDUAL' };
  createError = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers({ page: this.page, size: this.size, role: this.selectedRole || undefined, search: this.search || undefined }).subscribe({
      next: (data) => {
        this.users = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.loading = false;
      },
      error: () => {
        this.users = [
          { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@techstore.com', roleType: 'CORPORATE', isActive: true, createdAt: '2026-03-12', phone: '0532 100 2030' },
          { id: 2, name: 'Zeynep Kaya', email: 'zeynep@gmail.com', roleType: 'INDIVIDUAL', isActive: true, createdAt: '2026-03-28', phone: '0541 200 3040' },
          { id: 3, name: 'Murat Demir', email: 'murat@shop.com', roleType: 'CORPORATE', isActive: false, createdAt: '2026-04-02', phone: '0555 300 4050' },
          { id: 4, name: 'Elif Şahin', email: 'elif@hotmail.com', roleType: 'INDIVIDUAL', isActive: false, createdAt: '2026-04-05', phone: '0542 400 5060' },
          { id: 5, name: 'Platform Admin', email: 'admin@datapulse.com', roleType: 'ADMIN', isActive: true, createdAt: '2026-01-01', phone: '' },
        ];
        this.totalElements = 5;
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.page = 0;
    this.loadUsers();
  }

  onRoleFilter(): void {
    this.page = 0;
    this.loadUsers();
  }

  toggleStatus(user: UserModel): void {
    this.userService.toggleStatus(user.id).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx >= 0) this.users[idx] = updated;
      },
      error: () => {
        user.isActive = !user.isActive; // optimistic toggle fallback
      }
    });
    user.isActive = !user.isActive; // optimistic update
  }

  openCreate(): void {
    this.newUser = { name: '', email: '', password: 'Pass123!', roleType: 'INDIVIDUAL' };
    this.createError = '';
    this.showCreateModal = true;
  }

  createUser(): void {
    if (!this.newUser.name || !this.newUser.email) {
      this.createError = 'Ad ve e-posta zorunludur.';
      return;
    }
    this.userService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.users.unshift(user);
        this.showCreateModal = false;
      },
      error: () => { this.createError = 'Kullanıcı oluşturulamadı.'; }
    });
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.loadUsers(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadUsers(); } }

  getRoleBadge(role: string): string {
    return role === 'ADMIN' ? 'role-admin' : role === 'CORPORATE' ? 'role-corp' : 'role-ind';
  }
}
