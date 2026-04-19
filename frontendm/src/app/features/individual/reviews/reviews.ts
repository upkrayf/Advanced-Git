import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { ReviewService } from '../../../core/services/review';
import { ReviewModel } from '../../../core/models/review.model';

@Component({
  selector: 'app-individual-reviews',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css'
})
export class IndividualReviews implements OnInit {
  reviews: ReviewModel[] = [];
  loading = false;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.reviewService.getMyReviews().subscribe({
      next: (d) => { this.reviews = d; this.loading = false; },
      error: () => {
        this.reviews = [
          { id: 1, productId: 1, productName: 'iPhone 15 Pro', userId: 1, rating: 5, comment: 'Harika ürün!', storeResponse: 'Teşekkürler!', createdAt: '2026-04-10' },
          { id: 2, productId: 3, productName: 'iPad Air M2', userId: 1, rating: 4, comment: 'Güzel ama biraz pahalı.', createdAt: '2026-03-20' },
          { id: 3, productId: 5, productName: 'Nike Air Max', userId: 1, rating: 5, comment: 'Çok rahat!', createdAt: '2026-03-10' },
        ];
        this.loading = false;
      }
    });
  }

  getStars(rating: number): number[] { return [1, 2, 3, 4, 5]; }
}
