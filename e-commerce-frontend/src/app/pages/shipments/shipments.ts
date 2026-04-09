import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth'; // Rol kontrolü için ekledik

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shipments.html',
  styleUrls: ['./shipments.css']
})
export class Shipments implements OnInit {
  shipmentKpis: any[] = [];
  shipmentsList: any[] = [];
  userRole: string | null = ''; // Kullanıcının rolünü tutmak için

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getRole(); // LocalStorage'dan rolü çek [cite: 59]
    this.fetchShipments();
  }

  fetchShipments(): void {
    // PDF Sayfa 5: Rol bazlı veri kısıtlaması gereksinimi 
    // Admin her şeyi, Individual sadece kendi verisini görür.
    
    this.shipmentKpis = [
      { title: 'Pending', value: '156', icon: '📦', color: '#ffa502' },
      { title: 'In Transit', value: '423', icon: '🚚', color: '#4facfe' },
      { title: 'Delivered', value: '1,247', icon: '✅', color: '#00e676' },
      { title: 'Returns', value: '23', icon: '🔄', color: '#ff4757' }
    ];

    // PDF Sayfa 2: Kaggle veri setindeki (DS3) alanları ekledik: Warehouse ve Mode 
    this.shipmentsList = [
      { 
        id: 'TRK-892341', 
        orderId: '#7820', 
        customer: 'James Wilson', 
        carrier: 'FedEx', 
        warehouse: 'Block A', // DS3 key field 
        mode: 'Flight',       // DS3 key field 
        status: 'In Transit', 
        eta: 'Dec 4' 
      },
      { 
        id: 'TRK-892340', 
        orderId: '#7819', 
        customer: 'Emily Johnson', 
        carrier: 'UPS', 
        warehouse: 'Block B', 
        mode: 'Ship', 
        status: 'Pending', 
        eta: 'Dec 5' 
      }
    ];
  }

  getStatusClass(status: string): string {
    return status ? status.replace(/\s+/g, '-').toLowerCase() : '';
  }
}