import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { CartService } from '../../../../core/services/cart';
import { ProductModel } from '../../../../core/models/product.model';
import { CategoryModel } from '../../../../core/models/category.model';

@Component({
  selector: 'app-product-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './product-browse.html',
  styleUrl: './product-browse.css'
})
export class ProductBrowse implements OnInit {
  products: ProductModel[] = [];
  categories: CategoryModel[] = [];
  loading = false;
  search = '';
  selectedCategory = 0;
  sortBy: 'price_asc' | 'price_desc' | 'rating' = 'rating';
  page = 0;
  size = 24;
  totalElements = 0;
  totalPages = 0;
  cartSuccess = '';
  loadingMore = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (d) => this.categories = d,
      error: () => this.categories = [
        { id: 1, name: 'Elektronik' }, { id: 2, name: 'Giyim' },
        { id: 3, name: 'Ev & Yaşam' }, { id: 4, name: 'Kitap' }, { id: 5, name: 'Spor' }
      ]
    });
  }

  loadProducts(append = false): void {
    if (!append) {
      this.page = 0;
      this.products = [];
    }
    this.loading = !append;
    this.loadingMore = append;

    this.productService.getProducts({ page: this.page, size: this.size, search: this.search || undefined, categoryId: this.selectedCategory || undefined }).subscribe({
      next: (d) => {
        this.totalElements = d.totalElements;
        this.totalPages = d.totalPages;
        this.products = append ? [...this.products, ...d.content] : d.content;
        this.loading = false;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Product load failed', err);
        if (!append) {
          this.products = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  addToCart(product: ProductModel, event: Event): void {
    event.stopPropagation();
    this.cartService.addItem(product);
    this.cartSuccess = product.name;
    setTimeout(() => this.cartSuccess = '', 2000);
  }

  onSearch(): void { this.page = 0; this.loadProducts(false); }
  loadMore(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadProducts(true);
    }
  }
  getStars(rating: number): number[] { return [1, 2, 3, 4, 5]; }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  get sortedProducts(): ProductModel[] {
    const arr = [...this.products];
    if (this.sortBy === 'price_asc') return arr.sort((a, b) => a.price - b.price);
    if (this.sortBy === 'price_desc') return arr.sort((a, b) => b.price - a.price);
    return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
}
