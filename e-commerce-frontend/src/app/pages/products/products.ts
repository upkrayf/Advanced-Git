import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products {
  // PDF'teki görsellere uygun örnek ürünler [cite: 333, 334, 335, 336]
  productsList = [
    { id: 1, name: 'Classic Cotton T-Shirt', price: '39.99 ₺', icon: '👕', stock: '84 Adet' },
    { id: 2, name: 'Running Sneakers Pro', price: '89.99 ₺', icon: '👟', stock: '12 Adet' },
    { id: 3, name: 'Wireless Headphones', price: '149.99 ₺', icon: '🎧', stock: 'Stokta Yok' },
    { id: 4, name: 'Smart Watch Series X', price: '299.99 ₺', icon: '⌚', stock: '45 Adet' }
  ];
}