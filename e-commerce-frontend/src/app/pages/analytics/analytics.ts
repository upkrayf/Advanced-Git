import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class Analytics implements OnInit {
  // Veri setlerinden gelecek özet rakamlar
  stats = [
    { label: 'Total Sales', value: '$124,500', growth: '+12%', icon: '💰' },
    { label: 'Avg. Order Value', value: '$85.20', growth: '+5%', icon: '🛒' },
    { label: 'Conversion Rate', value: '3.8%', growth: '-1%', icon: '📈' }
  ];

  constructor() {}

  ngOnInit(): void {
    // Yarın burada Chart.js grafiklerini initialize edeceğiz
  }
}