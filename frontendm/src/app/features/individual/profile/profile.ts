import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { UserService } from '../../../core/services/user';
import { UserModel } from '../../../core/models/user.model';

const PROFILE_KEY = 'dp_profile';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: UserModel | null = null;
  editMode = false;
  saving = false;
  form: Partial<UserModel> = {};
  loading = false;
  success = '';
  error = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.userService.getMe().subscribe({
      next: u => {
        this.user = u;
        this.form = { fullName: u.fullName, phone: u.phone, city: u.city, gender: u.gender };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(u));
        this.loading = false;
      },
      error: () => {
        const cached = localStorage.getItem(PROFILE_KEY);
        this.user = cached ? JSON.parse(cached) : null;
        if (this.user) this.form = { fullName: this.user.fullName, phone: this.user.phone, city: this.user.city, gender: this.user.gender };
        this.loading = false;
      },
    });
  }

  startEdit(): void {
    this.form = { fullName: this.user?.fullName, phone: this.user?.phone, city: this.user?.city, gender: this.user?.gender };
    this.editMode = true;
  }

  save(): void {
    this.saving = true;
    this.userService.updateMe(this.form).subscribe({
      next: u => {
        this.user = u;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(u));
        this.editMode = false;
        this.saving = false;
        this.success = 'Profil başarıyla güncellendi!';
        setTimeout(() => this.success = '', 3000);
      },
      error: () => {
        this.saving = false;
        this.error = 'Kaydedilemedi. Lütfen tekrar deneyin.';
        setTimeout(() => this.error = '', 4000);
      },
    });
  }
}
