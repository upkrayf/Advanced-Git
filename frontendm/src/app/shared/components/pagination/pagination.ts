import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="totalPages > 1"
         style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color); font-size:13px;">
      <span style="color:var(--text-secondary);">
        Sayfa <strong style="color:var(--text-primary);">{{ page + 1 }}</strong> / <strong style="color:var(--text-primary);">{{ totalPages }}</strong>
      </span>
      <div style="display:flex; gap:4px; align-items:center;">
        <button (click)="onPrev()" [disabled]="page === 0"
                style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:6px;
                       border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-primary);
                       cursor:pointer; transition:background 0.2s; font-size:14px;"
                [style.opacity]="page === 0 ? '0.4' : '1'"
                [style.cursor]="page === 0 ? 'not-allowed' : 'pointer'">
          ‹
        </button>
        <ng-container *ngFor="let p of getPageNumbers()">
          <button (click)="goTo(p)"
                  [style.background]="p === page ? 'var(--accent-primary)' : 'var(--card-bg)'"
                  [style.color]="p === page ? '#fff' : 'var(--text-primary)'"
                  [style.border-color]="p === page ? 'var(--accent-primary)' : 'var(--border-color)'"
                  style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px;
                         border-radius:6px; border:1px solid; cursor:pointer; font-size:13px; font-weight:500; transition:background 0.2s;">
            {{ p + 1 }}
          </button>
        </ng-container>
        <button (click)="onNext()" [disabled]="page >= totalPages - 1"
                style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:6px;
                       border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-primary);
                       cursor:pointer; transition:background 0.2s; font-size:14px;"
                [style.opacity]="page >= totalPages - 1 ? '0.4' : '1'"
                [style.cursor]="page >= totalPages - 1 ? 'not-allowed' : 'pointer'">
          ›
        </button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() page = 0;
  @Input() totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages: number[] = [];
    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    if (start > 0) pages.unshift(0);
    if (end < total - 1) pages.push(total - 1);
    return [...new Set(pages)].sort((a, b) => a - b);
  }

  goTo(p: number): void { this.pageChange.emit(p); }
  onPrev(): void { if (this.page > 0) this.pageChange.emit(this.page - 1); }
  onNext(): void { if (this.page < this.totalPages - 1) this.pageChange.emit(this.page + 1); }
}
