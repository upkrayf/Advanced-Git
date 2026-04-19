import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { ProductService } from '../../../../core/services/product';
import { ReviewService } from '../../../../core/services/review';
import { CartService } from '../../../../core/services/cart';
import { ProductModel } from '../../../../core/models/product.model';
import { ReviewModel, CreateReviewRequest } from '../../../../core/models/review.model';

@Component({
  selector: 'app-individual-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class IndividualProductDetail implements OnInit {
  product: ProductModel | null = null;
  reviews: ReviewModel[] = [];
  loading = false;
  quantity = 1;
  cartSuccess = false;
  showReviewForm = false;
  newReview: CreateReviewRequest = { productId: 0, rating: 5, comment: '' };
  reviewError = '';

  constructor(
    private productService: ProductService,
    private reviewService: ReviewService,
    private cartService: CartService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    const id = +(this.route.snapshot.paramMap.get('id') || 0);
    if (!id) return;
    this.newReview.productId = id;
    this.loading = true;

    this.productService.getProduct(id).subscribe({
      next: (d) => { this.product = d; this.loading = false; },
      error: () => {
        this.product = { id, name: 'iPhone 15 Pro', description: 'Apple iPhone 15 Pro 256GB Titanium. A17 Pro çip, titanium tasarım.', price: 1199, stock: 24, categoryName: 'Elektronik', rating: 4.8, reviewCount: 312, storeName: 'TechStore' };
        this.loading = false;
      }
    });

    this.reviewService.getByProduct(id).subscribe({
      next: (d) => this.reviews = d,
      error: () => this.reviews = [
        { id: 1, productId: id, userId: 2, userName: 'Zeynep K.', rating: 5, comment: 'Harika ürün! Teslimat da çok hızlıydı.', createdAt: '2026-04-10' },
        { id: 2, productId: id, userId: 3, userName: 'Mert A.', rating: 4, comment: 'Genel olarak memnun kaldım.', createdAt: '2026-04-08' },
        { id: 3, productId: id, userId: 4, userName: 'Ayşe D.', rating: 5, comment: 'Kesinlikle tavsiye ederim!', storeResponse: 'Memnuniyetiniz en büyük ödülümüz!', createdAt: '2026-04-07' },
      ]
    });
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService.addItem(this.product, this.quantity);
    this.cartSuccess = true;
    setTimeout(() => this.cartSuccess = false, 2500);
  }

  submitReview(): void {
    if (!this.newReview.comment?.trim()) { this.reviewError = 'Yorum boş olamaz.'; return; }
    this.reviewService.addReview(this.newReview).subscribe({
      next: (r) => { this.reviews.unshift(r); this.showReviewForm = false; this.reviewError = ''; },
      error: () => { this.reviewError = 'Yorum gönderilemedi.'; }
    });
  }

  getStars(rating: number): number[] { return [1, 2, 3, 4, 5]; }
  avgRating(): string { if (!this.reviews.length) return '0.0'; return (this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length).toFixed(1); }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
