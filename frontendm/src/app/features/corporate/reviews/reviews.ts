import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { ReviewService } from '../../../core/services/review';
import { ReviewModel } from '../../../core/models/review.model';

@Component({
  selector: 'app-corporate-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css'
})
export class CorporateReviews implements OnInit {
  reviews: ReviewModel[] = [];
  loading = false;
  respondingTo: number | null = null;
  responseText = '';
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.reviewService.getAll({ page: this.page, size: this.size }).subscribe({
      next: (d) => {
        this.reviews = d.content || d;
        this.totalElements = d.totalElements || this.reviews.length;
        this.totalPages = d.totalPages || 1;
        this.loading = false;
      },
      error: () => {
        this.reviews = [
          { id: 1, productId: 1, productName: 'iPhone 15 Pro', userId: 2, userName: 'Zeynep K.', rating: 5, comment: 'Harika ürün, çok memnun kaldım!', createdAt: '2026-04-10' },
          { id: 2, productId: 2, productName: 'AirPods Pro', userId: 3, userName: 'Mert A.', rating: 4, comment: 'Ses kalitesi iyi ama kutu hasarlı geldi.', storeResponse: 'Üzgünüz, yeni ürün göndereceğiz.', createdAt: '2026-04-08' },
          { id: 3, productId: 3, productName: 'iPad Air', userId: 4, userName: 'Ayşe D.', rating: 3, comment: 'Beklentimi karşılamadı.', createdAt: '2026-04-07' },
        ];
        this.loading = false;
      }
    });
  }

  getStars(n: number): number[] { return [1, 2, 3, 4, 5]; }

  respond(id: number): void { this.respondingTo = id; this.responseText = ''; }

  submitResponse(): void {
    if (!this.respondingTo) return;
    this.reviewService.respondToReview(this.respondingTo, this.responseText).subscribe({
      next: (updated) => {
        const r = this.reviews.find(x => x.id === this.respondingTo);
        if (r) r.storeResponse = updated.storeResponse;
        this.respondingTo = null;
      },
      error: () => { this.respondingTo = null; }
    });
  }

  get avgRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }
}
