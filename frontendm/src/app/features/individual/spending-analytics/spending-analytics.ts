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
  loading = false; // Added loading state

  constructor(private analytics: Analytics) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.analytics.getMyStats().subscribe({
      next: (d) => { this.stats = d; },
      error: () => { this.stats = null; this.checkLoading(); }
    });

    this.analytics.getMySpendingByCategory().subscribe({
      next: (d) => {
        this.spendingByCategory = d;
        this.checkLoading();
      },
      error: () => { this.spendingByCategory = []; this.checkLoading(); }
    });

    this.loadTrend();
  }

  loadTrend(): void {
    this.analytics.getMySpendingTrend(this.period).subscribe({
      next: (d) => {
        this.spendingTrend = d;
        this.checkLoading();
      },
      error: () => { this.spendingTrend = []; this.checkLoading(); }
    });
  }

  checkLoading(): void {
    // Simple logic: if trend and categories are loaded, stop loading
    if (this.spendingTrend.length >= 0 && this.spendingByCategory.length >= 0) {
      setTimeout(() => this.loading = false, 500);
    }
  }

  changePeriod(p: 'daily' | 'monthly' | 'yearly'): void {
    this.period = p;
    this.loadTrend();
  }

  getMaxSpending(): number { return Math.max(...this.spendingByCategory.map(s => s.amount), 1); }
  getCategoryBarWidth(amount: number): string { return `${Math.round((amount / this.getMaxSpending()) * 100)}%`; }

  getMaxTrend(): number { return Math.max(...this.spendingTrend.map(r => r.value), 1); }
  getTrendBarHeight(value: number): string { return `${Math.round((value / this.getMaxTrend()) * 100)}%`; }

  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
