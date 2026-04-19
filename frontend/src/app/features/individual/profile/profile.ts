import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { UserService } from '../../../core/services/user';
import { UserModel } from '../../../core/models/user.model';

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
      next: (u) => { this.user = u; this.form = { ...u }; this.loading = false; },
      error: () => {
        this.user = { id: 1, name: 'Zeynep Kaya', email: 'zeynep@gmail.com', roleType: 'INDIVIDUAL', phone: '0541 200 3040', city: 'Ankara' };
        this.form = { ...this.user };
        this.loading = false;
      }
    });
  }

  save(): void {
    this.userService.updateMe(this.form).subscribe({
      next: (u) => { this.user = u; this.editMode = false; this.success = 'Profil güncellendi!'; setTimeout(() => this.success = '', 3000); },
      error: () => { this.error = 'Güncelleme başarısız.'; setTimeout(() => this.error = '', 3000); }
    });
  }
}
