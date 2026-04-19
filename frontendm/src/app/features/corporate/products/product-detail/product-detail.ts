import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { ProductService } from '../../../../core/services/product';
import { ReviewService } from '../../../../core/services/review';
import { ProductModel } from '../../../../core/models/product.model';
import { ReviewModel } from '../../../../core/models/review.model';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-corporate-product-detail',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class CorporateProductDetail implements OnInit {
  product: ProductModel | null = null;
  reviews: ReviewModel[] = [];
  loading = false;
  reviewResponse = '';
  respondingTo: number | null = null;

  constructor(
    private productService: ProductService,
    private reviewService: ReviewService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = +(this.route.snapshot.paramMap.get('id') || 0);
    if (!id) return;
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (d) => { this.product = d; this.loading = false; },
      error: () => {
        this.product = { id, name: 'iPhone 15 Pro', description: 'Apple iPhone 15 Pro 256GB', price: 1199, stock: 24, categoryName: 'Elektronik', rating: 4.8, isActive: true };
        this.loading = false;
      }
    });
    this.reviewService.getByProduct(id).subscribe({
      next: (d) => this.reviews = d,
      error: () => this.reviews = [
        { id: 1, productId: id, userId: 2, userName: 'Zeynep K.', rating: 5, comment: 'Harika ürün, çok memnun kaldım!', createdAt: '2026-04-10' },
        { id: 2, productId: id, userId: 3, userName: 'Mert A.', rating: 4, comment: 'Genel olarak iyi, teslimat hızlıydı.', createdAt: '2026-04-08' },
      ]
    });
  }

  getStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  respondTo(reviewId: number): void {
    this.respondingTo = reviewId;
    this.reviewResponse = '';
  }

  submitResponse(): void {
    if (!this.respondingTo || !this.reviewResponse.trim()) return;
    this.reviewService.respondToReview(this.respondingTo, this.reviewResponse).subscribe({
      next: (updated) => {
        const idx = this.reviews.findIndex(r => r.id === this.respondingTo);
        if (idx >= 0) this.reviews[idx] = updated;
        this.respondingTo = null;
        this.reviewResponse = '';
      },
      error: () => { this.respondingTo = null; }
    });
  }

  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
  avgRating(): number { if (!this.reviews.length) return 0; return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length; }
}
