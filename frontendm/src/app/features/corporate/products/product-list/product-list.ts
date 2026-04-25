import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { ProductModel } from '../../../../core/models/product.model';
import { CategoryModel } from '../../../../core/models/category.model';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-corporate-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule, PaginationComponent],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class CorporateProductList implements OnInit {
  products: any[] = [];
  categories: CategoryModel[] = [];
  loading = false;
  search = '';
  selectedCategory = 0;
  page = 0;
  size = 10;
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
      error: () => this.categories = []
    });
  }

  loadProducts(): void {
    this.loading = true;
    const params: any = { page: this.page, size: this.size };
    if (this.search.trim()) params['search'] = this.search.trim();
    if (this.selectedCategory > 0) params['categoryId'] = this.selectedCategory;
    this.productService.getProducts(params).subscribe({
      next: (d) => {
        this.products = d.content;
        this.totalElements = d.totalElements;
        this.totalPages = d.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadProducts();
  }

  deleteProduct(id: number): void {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    this.productService.deleteProduct(id).subscribe({
      next: () => { this.loadProducts(); },
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
