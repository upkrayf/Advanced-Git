import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from './services/auth'; // Servisi buraya da ekleyelim

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  showSidebar = true;
  userRole = 'INDIVIDUAL'; 

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Login sayfasındaysa menüyü gizle
        this.showSidebar = !event.urlAfterRedirects.includes('/login');
        
        // DÜZELTME: AuthService 'role' ismini kullanıyor, biz de 'role' olarak okumalıyız
        // Ayrıca backend bazen büyük/küçük harf gönderebilir, garantiye alalım.
        const storedRole = localStorage.getItem('role'); 
        this.userRole = storedRole ? storedRole.toUpperCase() : 'INDIVIDUAL';
        
        console.log('Sidebar Current Role:', this.userRole);
      }
    });
  }

  // Çıkış yapma fonksiyonunu servis ile uyumlu hale getirelim
  logout() {
    this.authService.logout(); // Servis içindeki logout zaten her şeyi temizliyor
    this.userRole = 'INDIVIDUAL'; // Rolü sıfırla
    this.router.navigate(['/login']);
  }
}