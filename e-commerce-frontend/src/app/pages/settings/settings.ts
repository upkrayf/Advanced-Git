import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class Settings {
  // Mağaza durumunu tutan değişken
  isStoreOpen: boolean = true;
  lastSync: string = '2 hours ago';

  // Mağazayı açıp kapatma fonksiyonu
  toggleStore() {
    this.isStoreOpen = !this.isStoreOpen;
    alert(this.isStoreOpen ? 'Store is now OPEN' : 'Store is now CLOSED');
  }

  // ETL (Veri çekme) işlemini tetikleme simülasyonu
  forceSync() {
    this.lastSync = 'Just now';
    alert('Kaggle datasets are being synchronized...');
  }
}