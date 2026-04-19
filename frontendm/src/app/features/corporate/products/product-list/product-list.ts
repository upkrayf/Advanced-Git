import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { ProductModel } from '../../../../core/models/product.model';
import { CategoryModel } from '../../../../core/models/category.model';

@Component({
  selector: 'app-corporate-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class CorporateProductList implements OnInit {
  products: ProductModel[] = [];
  categories: CategoryModel[] = [];
  loading = false;
  search = '';
  selectedCategory = 0;
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  constructor(private productService: ProductService, private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (d) => this.categories = d,
      error: () => this.categories = [
        { id: 1, name: 'Elektronik', productCount: 315 },
        { id: 2, name: 'Giyim', productCount: 210 },
        { id: 3, name: 'Ev & Yaşam', productCount: 178 },
      ]
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts({ page: this.page, size: this.size, search: this.search || undefined, categoryId: this.selectedCategory || undefined }).subscribe({
      next: (d) => {
        this.products = d.content;
        this.totalElements = d.totalElements;
        this.totalPages = d.totalPages;
        this.loading = false;
      },
      error: () => {
        this.products = [
          { id: 1, name: 'iPhone 15 Pro', description: 'Apple iPhone 15 Pro 256GB', price: 1199, stock: 24, categoryName: 'Elektronik', rating: 4.8, isActive: true },
          { id: 2, name: 'AirPods Pro', description: 'Apple AirPods Pro 2. Nesil', price: 249, stock: 8, categoryName: 'Elektronik', rating: 4.7, isActive: true },
          { id: 3, name: 'iPad Air', description: 'Apple iPad Air M2 64GB', price: 799, stock: 3, categoryName: 'Elektronik', rating: 4.6, isActive: true },
          { id: 4, name: 'MacBook Air', description: 'Apple MacBook Air M3 13"', price: 1299, stock: 15, categoryName: 'Elektronik', rating: 4.9, isActive: false },
        ];
        this.totalElements = 4;
        this.loading = false;
      }
    });
  }

  deleteProduct(id: number): void {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    this.productService.deleteProduct(id).subscribe({
      next: () => { this.products = this.products.filter(p => p.id !== id); },
      error: () => alert('Ürün silinemedi.')
    });
  }

  onSearch(): void { this.page = 0; this.loadProducts(); }
  prevPage(): void { if (this.page > 0) { this.page--; this.loadProducts(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadProducts(); } }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
  getStockClass(stock: number): string { return stock === 0 ? 'pill-red' : stock < 5 ? 'pill-amber' : 'pill-green'; }
  getStockLabel(stock: number): string { return stock === 0 ? 'Tükendi' : stock < 5 ? 'Kritik' : 'Mevcut'; }
}
