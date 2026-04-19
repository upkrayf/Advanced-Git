import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product';
import { ReviewService } from '../../core/services/review';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="product-detail-page" *ngIf="product; else loading">
      <!-- Back Button -->
      <a routerLink="/products" class="back-link">
        <span class="back-icon">←</span> Back to Products
      </a>

      <div class="product-hero">
        <div class="product-image-container">
          <div class="product-image-placeholder">
            <span class="icon">📦</span>
          </div>
        </div>
        <div class="product-info-container">
          <div class="product-category">{{ product.category || 'General' }}</div>
          <h1 class="product-title">{{ product.description || product.name || 'Unknown Product' }}</h1>
          <div class="product-price">\${{ product.unitPrice || product.price || '0.00' }}</div>
          
          <div class="product-meta">
            <p *ngIf="product.stockCode"><strong>SKU:</strong> {{ product.stockCode }}</p>
            <p *ngIf="product.quantity"><strong>Stock:</strong> {{ product.quantity }} available</p>
            <p *ngIf="product.country"><strong>Origin:</strong> {{ product.country }}</p>
          </div>

          <button class="add-to-cart-btn">Add to Cart</button>
        </div>
      </div>

      <div class="reviews-section">
        <div class="reviews-header">
          <h2>Customer Reviews</h2>
          <div class="rating-summary" *ngIf="reviews.length > 0">
            <span class="average-rating">{{ getAverageRating() | number:'1.1-1' }}</span>
            <span class="star-icon">★</span>
            <span class="review-count">({{ reviews.length }} reviews)</span>
          </div>
        </div>

        <!-- Write Review Form -->
        <div class="write-review-card" *ngIf="isLoggedIn; else loginPrompt">
          <h3>Write a Review</h3>
          <form (ngSubmit)="submitReview()" class="review-form">
            <div class="star-rating-input">
              <label>Rating:</label>
              <div class="stars">
                <span *ngFor="let star of [1,2,3,4,5]" 
                      class="star" 
                      [class.active]="star <= newReview.rating"
                      (click)="newReview.rating = star">
                  ★
                </span>
              </div>
            </div>
            <div class="form-group">
              <textarea 
                [(ngModel)]="newReview.comment" 
                name="comment" 
                placeholder="Share your thoughts about this product..."
                rows="3"
                required>
              </textarea>
            </div>
            <button type="submit" class="submit-review-btn" [disabled]="!newReview.rating || !newReview.comment.trim()">
              Submit Review
            </button>
          </form>
        </div>
        
        <ng-template #loginPrompt>
          <div class="login-prompt">
            <p>Please <a routerLink="/login">log in</a> to write a review.</p>
          </div>
        </ng-template>

        <!-- Reviews List -->
        <div class="reviews-list" *ngIf="reviews.length > 0; else noReviews">
          <div class="review-item" *ngFor="let review of reviews">
            <div class="review-header">
              <div class="review-stars">
                <span *ngFor="let star of [1,2,3,4,5]" class="star-read" [class.active-read]="star <= (review.starRating || review.rating)">★</span>
              </div>
              <span class="review-date" *ngIf="review.createdAt">{{ review.createdAt | date }}</span>
            </div>
            <p class="review-text">{{ review.reviewText || review.comment }}</p>
            <div class="review-author" *ngIf="review.customer">
              By Customer #{{ review.customer.id || review.customer }}
            </div>
          </div>
        </div>

        <ng-template #noReviews>
          <div class="empty-reviews">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        </ng-template>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading product details...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .product-detail-page {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      margin-bottom: 2rem;
      transition: color 0.2s;
    }
    .back-link:hover {
      color: #111827;
    }
    .back-icon {
      margin-right: 0.5rem;
      font-size: 1.25rem;
    }
    
    .product-hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      margin-bottom: 4rem;
      background: #fff;
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    @media (max-width: 768px) {
      .product-hero {
        grid-template-columns: 1fr;
      }
    }
    
    .product-image-container {
      width: 100%;
    }
    .product-image-placeholder {
      aspect-ratio: 1/1;
      background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6rem;
    }
    
    .product-info-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .product-category {
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .product-title {
      font-size: 2.25rem;
      color: #111827;
      font-weight: 800;
      margin: 0 0 1rem 0;
      line-height: 1.2;
    }
    .product-price {
      font-size: 2rem;
      color: #3b82f6;
      font-weight: 700;
      margin-bottom: 2rem;
    }
    .product-meta {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
    }
    .product-meta p {
      margin: 0.5rem 0;
      color: #4b5563;
    }
    .add-to-cart-btn {
      background: #111827;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 9999px;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .add-to-cart-btn:hover {
      background: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(59,130,246,0.3);
    }
    
    .reviews-section {
      background: #fff;
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .reviews-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .reviews-header h2 {
      font-size: 1.5rem;
      margin: 0;
      color: #111827;
    }
    .rating-summary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef3c7;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
    }
    .average-rating {
      font-weight: 700;
      color: #92400e;
    }
    .star-icon {
      color: #d97706;
    }
    .review-count {
      color: #92400e;
      font-size: 0.875rem;
    }
    
    .write-review-card {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2.5rem;
      border: 1px solid #e5e7eb;
    }
    .write-review-card h3 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
    }
    .star-rating-input {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .stars {
      display: flex;
      gap: 0.25rem;
    }
    .star {
      font-size: 1.5rem;
      color: #d1d5db;
      cursor: pointer;
      transition: color 0.1s;
    }
    .star:hover, .star.active {
      color: #fbbf24;
    }
    .form-group textarea {
      width: 100%;
      padding: 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.75rem;
      resize: vertical;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-group textarea:focus {
      border-color: #3b82f6;
    }
    .submit-review-btn {
      margin-top: 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .submit-review-btn:hover:not(:disabled) {
      background: #2563eb;
    }
    .submit-review-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    
    .login-prompt {
      background: #eff6ff;
      padding: 1.5rem;
      border-radius: 1rem;
      color: #1e3a8a;
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-prompt a {
      color: #2563eb;
      font-weight: 600;
      text-decoration: underline;
    }
    
    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .review-item {
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .review-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .review-stars {
      display: flex;
      gap: 0.125rem;
    }
    .star-read {
      color: #d1d5db;
      font-size: 1.125rem;
    }
    .star-read.active-read {
      color: #fbbf24;
    }
    .review-date {
      color: #9ca3af;
      font-size: 0.875rem;
    }
    .review-text {
      color: #374151;
      line-height: 1.5;
      margin: 0 0 0.5rem 0;
    }
    .review-author {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }
    
    .empty-reviews {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      background: #f9fafb;
      border-radius: 1rem;
    }
    
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
      color: #6b7280;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ProductDetail implements OnInit {
  product: any = null;
  reviews: any[] = [];
  isLoggedIn: boolean = false;
  
  newReview = {
    rating: 0,
    comment: ''
  };

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private reviewService: ReviewService,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.auth.isLoggedIn();
    
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: number) {
    // 1. Fetch Product
    this.productService.getProduct(id).subscribe({
      next: (data: any) => {
        this.product = data;
        // 2. Fetch Reviews once product is loaded
        this.loadReviews(id);
      },
      error: (err: any) => console.error('Error fetching product', err)
    });
  }

  loadReviews(productId: number) {
    this.reviewService.getByProduct(productId).subscribe({
      next: (data: any) => {
        this.reviews = data || [];
      },
      error: (err: any) => console.error('Error fetching reviews', err)
    });
  }

  getAverageRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, rev) => {
      const p = rev.starRating || rev.rating || 0;
      return acc + p;
    }, 0);
    return sum / this.reviews.length;
  }

  submitReview() {
    if (!this.product || !this.newReview.rating || !this.newReview.comment.trim()) {
      return;
    }

    const reviewPayload = {
      productId: this.product.id,
      rating: this.newReview.rating,
      comment: this.newReview.comment
    };

    this.reviewService.addReview(reviewPayload).subscribe({
      next: (savedReview: any) => {
        // Optimistically add to list
        this.reviews.unshift(savedReview);
        // Reset form
        this.newReview = { rating: 0, comment: '' };
      },
      error: (err: any) => {
        console.error('Error submitting review', err);
        alert('Failed to submit review. You must be logged in as an INDIVIDUAL user.');
      }
    });
  }
}
