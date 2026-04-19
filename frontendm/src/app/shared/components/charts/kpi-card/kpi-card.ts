import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  imports: [],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.css',
})
export class KpiCard {
  @Input() label: string = 'Başlık Yok';     
  @Input() value: string | number = '0';     
  @Input() badgeText: string = '';            
  @Input() badgeColorClass: string = 'badge-green';
}
