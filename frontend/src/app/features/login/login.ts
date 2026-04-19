import { Component } from '@angular/core';
import { Auth } from '../../core/services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login{
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: Auth) { }

  onLogin(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'E-posta ve şifre boş olamaz.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: () => {},
      error: () => {
        this.errorMessage = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      }
    });
  }

  fillDemo(role: 'admin' | 'corporate' | 'individual'): void {
    const accounts = {
      admin: { email: 'admin@test.com', password: '123' },
      corporate: { email: 'corporate@test.com', password: '123' },
      individual: { email: 'individual@test.com', password: '123' }
    };
    this.email = accounts[role].email;
    this.password = accounts[role].password;
  }
}