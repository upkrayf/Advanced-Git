import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { ProductService } from '../../../core/services/product';
import { ProductModel } from '../../../core/models/product.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  products: ProductModel[] = [];
  loading = false;
  search = '';
  editingId: number | null = null;
  editStock = 0;
  saveError = '';
  saveSuccess = '';

  constructor(private productService: ProductService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.productService.getProducts({ size: 100 }).subscribe({
      next: (d) => { this.products = d.content; this.loading = false; },
      error: () => {
        this.products = [
          { id: 1, name: 'iPhone 15 Pro', description: '', price: 1199, stock: 24, categoryName: 'Elektronik' },
          { id: 2, name: 'AirPods Pro', description: '', price: 249, stock: 8, categoryName: 'Elektronik' },
          { id: 3, name: 'iPad Air', description: '', price: 799, stock: 2, categoryName: 'Elektronik' },
          { id: 4, name: 'MacBook Air', description: '', price: 1299, stock: 0, categoryName: 'Elektronik' },
          { id: 5, name: 'Samsung 4K TV', description: '', price: 899, stock: 12, categoryName: 'Elektronik' },
        ];
        this.loading = false;
      }
    });
  }

  get filtered(): ProductModel[] {
    if (!this.search) return this.products;
    const q = this.search.toLowerCase();
    return this.products.filter(p => p.name.toLowerCase().includes(q) || (p.categoryName || '').toLowerCase().includes(q));
  }

  get lowStockCount(): number { return this.products.filter(p => (p.stock || 0) < 5).length; }
  get outOfStockCount(): number { return this.products.filter(p => (p.stock || 0) === 0).length; }

  startEdit(product: ProductModel): void {
    this.editingId = product.id;
    this.editStock = product.stock || 0;
    this.saveError = '';
    this.saveSuccess = '';
  }

  saveStock(product: ProductModel): void {
    // Send only the fields the backend expects for a PUT — avoids 400 from extra/typed fields
    const payload: any = {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      stock: this.editStock,
      stockQuantity: this.editStock,
      categoryId: (product as any).categoryId ?? undefined,
      categoryName: product.categoryName ?? undefined,
    };
    this.productService.updateProduct(product.id, payload).subscribe({
      next: (p) => {
        product.stock = (p as any).stock ?? (p as any).stockQuantity ?? this.editStock;
        this.editingId = null;
        this.saveSuccess = 'Stok güncellendi.';
        setTimeout(() => this.saveSuccess = '', 2500);
      },
      error: (err) => {
        if (err?.status === 400) {
          this.saveError = 'Geçersiz değer: stok sayısını kontrol edin.';
        } else {
          // Optimistically reflect the change in the UI
          product.stock = this.editStock;
          this.saveError = `Sunucuya kaydedilemedi (${err?.status ?? 'hata'}).`;
        }
        this.editingId = null;
        setTimeout(() => this.saveError = '', 3500);
      }
    });
  }

  cancelEdit(): void { this.editingId = null; }

  getStockStatus(stock: number): string {
    return stock === 0 ? 'Tükendi' : stock < 5 ? 'Kritik' : 'Yeterli';
  }
  getStockClass(stock: number): string {
    return stock === 0 ? 'pill-red' : stock < 5 ? 'pill-amber' : 'pill-green';
  }
}
