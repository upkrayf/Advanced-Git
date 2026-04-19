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
  size = 20;
  totalElements = 0;
  totalPages = 0;
  cartSuccess = '';

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

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts({ page: this.page, size: this.size, search: this.search || undefined, categoryId: this.selectedCategory || undefined }).subscribe({
      next: (d) => { this.products = d.content; this.totalElements = d.totalElements; this.totalPages = d.totalPages; this.loading = false; },
      error: () => {
        this.products = [
          { id: 1, name: 'iPhone 15 Pro', description: 'Apple iPhone 15 Pro 256GB Titanium', price: 1199, stock: 24, categoryName: 'Elektronik', rating: 4.8, reviewCount: 312 },
          { id: 2, name: 'AirPods Pro', description: 'Apple AirPods Pro 2. Nesil Aktif Gürültü Engelleme', price: 249, stock: 8, categoryName: 'Elektronik', rating: 4.7, reviewCount: 198 },
          { id: 3, name: 'iPad Air M2', description: 'Apple iPad Air M2 11" 64GB Wi-Fi', price: 599, stock: 12, categoryName: 'Elektronik', rating: 4.6, reviewCount: 145 },
          { id: 4, name: 'Samsung QLED 55"', description: 'Samsung 55Q80C 4K QLED TV', price: 899, stock: 5, categoryName: 'Elektronik', rating: 4.5, reviewCount: 87 },
          { id: 5, name: 'Nike Air Max 270', description: 'Nike Air Max 270 Koşu Ayakkabısı', price: 129, stock: 30, categoryName: 'Spor', rating: 4.4, reviewCount: 421 },
          { id: 6, name: 'Sony WH-1000XM5', description: 'Sony Kablosuz Kulaklık ANC', price: 349, stock: 18, categoryName: 'Elektronik', rating: 4.9, reviewCount: 256 },
          { id: 7, name: 'Zara Kışlık Mont', description: 'Zara Kadın Kışlık Uzun Mont', price: 189, stock: 22, categoryName: 'Giyim', rating: 4.2, reviewCount: 134 },
          { id: 8, name: 'IKEA Ofis Koltuğu', description: 'IKEA Markus Ofis Sandalyesi', price: 299, stock: 7, categoryName: 'Ev & Yaşam', rating: 4.3, reviewCount: 89 },
        ];
        this.totalElements = 8;
        this.loading = false;
      }
    });
  }

  addToCart(product: ProductModel, event: Event): void {
    event.stopPropagation();
    this.cartService.addItem(product);
    this.cartSuccess = product.name;
    setTimeout(() => this.cartSuccess = '', 2000);
  }

  onSearch(): void { this.page = 0; this.loadProducts(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.loadProducts(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadProducts(); } }
  getStars(rating: number): number[] { return [1, 2, 3, 4, 5]; }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  get sortedProducts(): ProductModel[] {
    const arr = [...this.products];
    if (this.sortBy === 'price_asc') return arr.sort((a, b) => a.price - b.price);
    if (this.sortBy === 'price_desc') return arr.sort((a, b) => b.price - a.price);
    return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
}
