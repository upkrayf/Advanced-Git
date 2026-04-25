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
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  user: UserModel | null = null;
  editMode = false;
  form: Partial<UserModel> = {};
  loading = false;
  success = '';
  error = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.userService.getMe().subscribe({
      next: (u) => {
        this.user = u;
        this.form = { ...u };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(u));
        this.loading = false;
      },
      error: () => {
        const cached = localStorage.getItem(PROFILE_KEY);
        this.user = cached ? JSON.parse(cached)
          : { id: 1, fullName: 'Zeynep Kaya', email: 'zeynep@gmail.com', roleType: 'INDIVIDUAL', phone: '0541 200 3040', city: 'Ankara' };
        this.form = { ...this.user };
        this.loading = false;
      }
    });
  }

  save(): void {
    this.userService.updateMe(this.form).subscribe({
      next: (u) => {
        this.user = u;
        this.form = { ...u };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(u));
        this.editMode = false;
        this.success = 'Profil güncellendi!';
        setTimeout(() => this.success = '', 3000);
      },
      error: () => {
        // Persist locally so the user sees their changes on refresh even if API is down
        const merged = { ...this.user, ...this.form } as UserModel;
        this.user = merged;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
        this.editMode = false;
        this.error = 'Sunucuya kaydedilemedi, yerel olarak güncellendi.';
        setTimeout(() => this.error = '', 4000);
      }
    });
  }
}
