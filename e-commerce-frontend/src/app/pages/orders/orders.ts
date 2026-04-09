import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../services/orderService'; // Servisi bağladık

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html', // Uzantıyı .html olarak kontrol et
  styleUrls: ['./orders.css']
})
export class Orders implements OnInit {
  // Liste artık boş başlıyor, servisten dolacak
  ordersList: any[] = [];
  errorMessage: string = '';

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.ordersService.getAllOrders().subscribe({
      next: (data) => {
        this.ordersList = data;
      },
      error: (err) => {
        this.errorMessage = "Sipariş verileri alınamadı.";
        console.error(err);
      }
    });
  }

  getStatusClass(status: string): string {
    return status ? status.toLowerCase() : '';
  }
}