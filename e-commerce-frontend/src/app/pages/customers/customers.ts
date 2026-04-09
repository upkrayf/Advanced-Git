import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css']
})
export class Customers {
  // PDF'teki müşteri yönetimi görselindeki özet veriler [cite: 347, 352, 353, 354]
  customerKpis = [
    { title: 'Total Customers', value: '3,421', icon: '👥', trend: '+12.5%' },
    { title: 'New This Month', value: '284', icon: '🆕', trend: '+5.2%' },
    { title: 'Gold Members', value: '892', icon: '👑', trend: '+2.1%' },
    { title: 'Avg LTV', value: '$142', icon: '💰', trend: '+8.4%' }
  ];

  // PDF'teki tabloya uygun müşteri listesi [cite: 348, 349, 356, 357]
  customersList = [
    { name: 'Sarah Miller', email: 'sarah.m@example.com', membership: 'Gold', spent: '$1,284.00', orders: 14, status: 'Active' },
    { name: 'James Wilson', email: 'j.wilson@example.com', membership: 'Silver', spent: '$756.50', orders: 8, status: 'Active' },
    { name: 'Emily Johnson', email: 'emily.j@example.com', membership: 'Bronze', spent: '$432.00', orders: 5, status: 'Active' },
    { name: 'Michael Lee', email: 'mike.lee@example.com', membership: 'New', spent: '$89.99', orders: 1, status: 'Inactive' }
  ];
}