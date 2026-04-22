import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Analytics } from '../../../core/services/analytics';
import { IndividualStats, SpendingByCategory, RevenuePoint } from '../../../core/models/analytics.model';

@Component({
  selector: 'app-spending-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './spending-analytics.html',
  styleUrl: './spending-analytics.css'
})
export class SpendingAnalytics implements OnInit {
  stats: IndividualStats | null = null;
  spendingByCategory: SpendingByCategory[] = [];
  spendingTrend: RevenuePoint[] = [];
  period: 'daily' | 'monthly' | 'yearly' = 'monthly';

  constructor(private analytics: Analytics) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.analytics.getMyStats().subscribe({
      next: (d) => this.stats = d,
      error: () => this.stats = null
    });

    this.analytics.getMySpendingByCategory().subscribe({
      next: (d) => this.spendingByCategory = d,
      error: () => this.spendingByCategory = []
    });

    this.analytics.getMySpendingTrend(this.period).subscribe({
      next: (d) => this.spendingTrend = d,
      error: () => this.spendingTrend = []
    });
  }

  changePeriod(p: 'daily' | 'monthly' | 'yearly'): void {
    this.period = p;
    this.analytics.getMySpendingTrend(p).subscribe({ next: (d) => this.spendingTrend = d, error: () => {} });
  }

  getMaxSpending(): number { return Math.max(...this.spendingByCategory.map(s => s.amount), 1); }
  getCategoryBarWidth(amount: number): string { return `${Math.round((amount / this.getMaxSpending()) * 100)}%`; }

  getMaxTrend(): number { return Math.max(...this.spendingTrend.map(r => r.value), 1); }
  getTrendBarHeight(value: number): string { return `${Math.round((value / this.getMaxTrend()) * 100)}%`; }

  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
