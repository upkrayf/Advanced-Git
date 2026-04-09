import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import {FormsModule} from '@angular/forms';


@Component({
  selector: 'app-login',
  imports: [FormsModule,],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  loginData = { email: '', password: '' };
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
  this.authService.login(this.loginData).subscribe({
    next: (res) => {
      // ÖNEMLİ: AuthService içindeki tap() sayesinde role zaten kaydedildi.
      console.log('Backendden gelen rol:', res.role);

      // Yönlendirme ve Sayfayı Yenileme
      if (res.role === 'ADMIN' || res.role === 'CORPORATE') {
        // Router.navigate yerine bunu kullanıyoruz:
        window.location.href = '/dashboard'; 
      } else {
        window.location.href = '/products';
      }
    },
    error: (err) => {
      alert('Giriş başarısız! Bilgileri kontrol et.');
    }
  });
}
}
