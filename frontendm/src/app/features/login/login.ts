import { Component } from '@angular/core';
import { Auth } from '../../core/services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email: string = '';
  password: string = '';
  fullName: string = '';
  gender: string = 'Male';
  age: number | null = null;
  roleType: string = 'INDIVIDUAL';

  isRegister: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: Auth) { }

  toggleRegister(): void {
    this.isRegister = !this.isRegister;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin(): void {
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'E-posta ve şifre boş olamaz.';
      return;
    }
    this.authService.login(this.email, this.password).subscribe({
      next: () => { },
      error: () => {
        this.errorMessage = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      }
    });
  }

  onRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password || !this.fullName) {
      this.errorMessage = 'Lütfen zorunlu alanları doldurun.';
      return;
    }

    const data = {
      email: this.email,
      password: this.password,
      fullName: this.fullName,
      gender: this.gender,
      age: this.age,
      roleType: this.roleType
    };

    this.authService.register(data).subscribe({
      next: () => {
        this.successMessage = 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.';
        this.isRegister = false;
      },
      error: (err) => {
        this.errorMessage = 'Kayıt başarısız: ' + (err.error?.message || 'Bir hata oluştu');
      }
    });
  }

  fillDemo(role: 'admin' | 'corporate' | 'individual'): void {
    const accounts = {
      admin: { email: 'admin@datapulse.com', password: '123' },
      corporate: { email: 'uk@datapulse.com', password: '123' },
      individual: { email: 'ds3user310@logistics.com', password: '123' }
    };
    this.email = accounts[role].email;
    this.password = accounts[role].password;
  }
}