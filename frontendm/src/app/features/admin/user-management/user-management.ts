import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { UserService } from '../../../core/services/user';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule, PaginationComponent],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  users: any[] = [];
  loading = false;
  search = '';
  selectedRole = '';
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  toast = '';
  toastType: 'success' | 'error' = 'success';

  showCreateModal = false;
  newUser: any = { fullName: '', email: '', password: 'Pass123!', roleType: 'INDIVIDUAL', gender: 'Male', age: null };
  createError = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers({
      page: this.page,
      size: this.size,
      search: this.search.trim() || undefined,
      role: this.selectedRole || undefined
    }).subscribe({
      next: (data) => {
        this.users = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void { this.page = 0; this.loadUsers(); }
  onRoleFilter(): void { this.page = 0; this.loadUsers(); }
  onPageChange(page: number): void { this.page = page; this.loadUsers(); }

  deleteUser(id: number): void {
    if (!confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return;
    this.userService.deleteUser(id).subscribe({
      next: () => { this.showToast('Kullanıcı silindi.', 'success'); this.loadUsers(); },
      error: (err) => {
        const msg = err?.error?.message || `Sunucu hatası (${err?.status ?? 500})`;
        this.showToast('Silinemedi: ' + msg, 'error');
      }
    });
  }

  openCreate(): void {
    this.newUser = { fullName: '', email: '', password: 'Pass123!', roleType: 'INDIVIDUAL', gender: 'Male', age: null };
    this.createError = '';
    this.showCreateModal = true;
  }

  createUser(): void {
    if (!this.newUser.fullName || !this.newUser.email) {
      this.createError = 'Ad ve e-posta zorunludur.';
      return;
    }
    this.userService.createUser(this.newUser).subscribe({
      next: () => { this.loadUsers(); this.showCreateModal = false; this.showToast('Kullanıcı oluşturuldu.', 'success'); },
      error: (err) => { this.createError = err?.error?.message || 'Kullanıcı oluşturulamadı.'; }
    });
  }

  getRoleBadge(role: string): string {
    return role === 'ADMIN' ? 'role-admin' : role === 'CORPORATE' ? 'role-corp' : 'role-ind';
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3500);
  }
}
