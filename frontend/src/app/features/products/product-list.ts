import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="product-page">
      <div class="header">
        <h1>Our Products</h1>
        <div class="search-container">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="filterProducts()"
            placeholder="Search products..." 
            class="search-input"
          />
        </div>
      </div>

      <div class="product-grid" *ngIf="filteredProducts.length > 0; else noData">
        <div class="product-card" *ngFor="let product of filteredProducts" [routerLink]="['/products', product.id]">
          <div class="product-image-placeholder">
            <!-- Simulated image space -->
            <span class="icon">📦</span>
          </div>
          <div class="product-info">
            <div class="product-category">{{ product.category || 'General' }}</div>
            <h3 class="product-title">{{ product.description || product.name || 'Unknown Product' }}</h3>
            <div class="product-price">\${{ product.unitPrice || product.price || '0.00' }}</div>
          </div>
        </div>
      </div>
      
      <ng-template #noData>
        <div class="empty-state">
          No products found matching your search.
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .product-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2.5rem;
      color: #111827;
      margin: 0;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .search-container {
      position: relative;
      width: 300px;
    }
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 9999px;
      outline: none;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
    }
    .product-card {
      background: #ffffff;
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid #f3f4f6;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
      border-color: #e5e7eb;
    }
    .product-image-placeholder {
      height: 200px;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
    }
    .product-info {
      padding: 1.5rem;
    }
    .product-category {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .product-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 1rem 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #3b82f6;
      display: flex;
      align-items: center;
    }
    .empty-state {
      text-align: center;
      padding: 4rem;
      color: #6b7280;
      font-size: 1.125rem;
      background: #f9fafb;
      border-radius: 1rem;
    }
  `]
})
export class ProductList implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm: string = '';

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.productService.getProducts({ size: 50 }).subscribe({
      next: (data: any) => {
        const items = data?.content || data || [];
        this.products = items;
        this.filteredProducts = items;
      },
      error: (err) => console.error('Error fetching products', err)
    });
  }

  filterProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = this.products;
      return;
    }
    const lowerTerm = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p => 
      (p.description && p.description.toLowerCase().includes(lowerTerm)) ||
      (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
      (p.category && p.category.toLowerCase().includes(lowerTerm))
    );
  }
}
