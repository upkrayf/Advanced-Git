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
  styleUrl: './spending-analytics.css',
})
export class SpendingAnalytics implements OnInit {
  stats: IndividualStats | null = null;
  spendingByCategory: SpendingByCategory[] = [];
  spendingTrend: RevenuePoint[] = [];

  period: 'daily' | 'monthly' | 'yearly' = 'monthly';
  loading = false;

  // SVG line chart coordinate constants (viewBox 0 0 800 260)
  readonly TML = 62;             // margin left  (y-axis labels)
  readonly TMR = 20;             // margin right
  readonly TMT = 18;             // margin top
  readonly TMB = 44;             // margin bottom (x-axis labels)
  readonly TAW = 800 - 62 - 20; // chart area width  = 718
  readonly TAH = 260 - 18 - 44; // chart area height = 198

  constructor(private analytics: Analytics) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.analytics.getMyStats().subscribe({
      next: d  => { this.stats = d; },
      error: () => { this.stats = null; },
    });
    this.analytics.getMySpendingByCategory().subscribe({
      next: d  => { this.spendingByCategory = d; this.stopLoading(); },
      error: () => { this.spendingByCategory = []; this.stopLoading(); },
    });
    this.loadTrend();
  }

  loadTrend(): void {
    this.analytics.getMySpendingTrend(this.period).subscribe({
      next: d  => { this.spendingTrend = d; this.stopLoading(); },
      error: () => { this.spendingTrend = []; this.stopLoading(); },
    });
  }

  stopLoading(): void { setTimeout(() => this.loading = false, 300); }

  changePeriod(p: 'daily' | 'monthly' | 'yearly'): void {
    this.period = p;
    this.loadTrend();
  }

  // ── Category bar helpers ────────────────────────────────────────────────────
  getMaxSpending(): number { return Math.max(...this.spendingByCategory.map(s => +s.amount), 1); }
  getCategoryBarWidth(amount: number): string {
    return `${Math.round((+amount / this.getMaxSpending()) * 100)}%`;
  }

  // ── Line chart helpers ──────────────────────────────────────────────────────
  trendMax(): number {
    const raw = Math.max(...this.spendingTrend.map(r => +r.value), 1);
    const exp = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw / exp) * exp;
  }

  fmtVal(v: number): string {
    const n = +v;
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }

  trendYTicks(): Array<{ y: number; label: string }> {
    const max = this.trendMax();
    return [0, 1, 2, 3, 4, 5].map(i => ({
      y: this.TMT + this.TAH - (i / 5) * this.TAH,
      label: this.fmtVal((max / 5) * i),
    }));
  }

  private trendPts(): Array<{ x: number; y: number }> {
    const max = this.trendMax();
    const n   = this.spendingTrend.length;
    return this.spendingTrend.map((r, i) => ({
      x: this.TML + (n > 1 ? (i / (n - 1)) * this.TAW : this.TAW / 2),
      y: this.TMT + this.TAH - (max > 0 ? (+r.value / max) * this.TAH : 0),
    }));
  }

  trendLinePath(): string {
    const pts = this.trendPts();
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cp = (pts[i].x - pts[i - 1].x) / 2;
      d += ` C ${(pts[i-1].x + cp).toFixed(1)},${pts[i-1].y.toFixed(1)}`
         + ` ${(pts[i].x   - cp).toFixed(1)},${pts[i].y.toFixed(1)}`
         + ` ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    return d;
  }

  trendAreaPath(): string {
    const line = this.trendLinePath();
    if (!line) return '';
    const pts = this.trendPts();
    const bot = (this.TMT + this.TAH).toFixed(1);
    return `${line} L ${pts[pts.length - 1].x.toFixed(1)},${bot} L ${pts[0].x.toFixed(1)},${bot} Z`;
  }

  trendDots(): Array<{ cx: number; cy: number; showDot: boolean; label: string; valLabel: string }> {
    const pts  = this.trendPts();
    const n    = this.spendingTrend.length;
    const step = n > 16 ? Math.ceil(n / 8) : 1;
    return this.spendingTrend.map((r, i) => ({
      cx:      pts[i].x,
      cy:      pts[i].y,
      showDot: n <= 16 || i % step === 0 || i === n - 1,
      label:   (i % step === 0 || i === n - 1) ? r.name : '',
      valLabel: this.fmtVal(+r.value),
    }));
  }

  formatCurrency(v: number): string {
    return '$' + (+v).toLocaleString('en-US', { minimumFractionDigits: 2 });
  }
}
