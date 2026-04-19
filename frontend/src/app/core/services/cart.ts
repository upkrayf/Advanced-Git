import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductModel } from '../models/product.model';

export interface CartItem {
  product: ProductModel;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartKey = 'datapulse_cart';
  private cartSubject = new BehaviorSubject<CartItem[]>(this.loadCart());

  cart$: Observable<CartItem[]> = this.cartSubject.asObservable();

  private loadCart(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(this.cartKey) || '[]');
    } catch { return []; }
  }

  private saveCart(items: CartItem[]): void {
    localStorage.setItem(this.cartKey, JSON.stringify(items));
    this.cartSubject.next(items);
  }

  getItems(): CartItem[] {
    return this.cartSubject.getValue();
  }

  addItem(product: ProductModel, quantity = 1): void {
    const items = this.getItems();
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ product, quantity });
    }
    this.saveCart(items);
  }

  removeItem(productId: number): void {
    const items = this.getItems().filter(i => i.product.id !== productId);
    this.saveCart(items);
  }

  updateQuantity(productId: number, quantity: number): void {
    const items = this.getItems();
    const item = items.find(i => i.product.id === productId);
    if (item) {
      item.quantity = quantity > 0 ? quantity : 1;
      this.saveCart(items);
    }
  }

  clearCart(): void {
    this.saveCart([]);
  }

  getTotal(): number {
    return this.getItems().reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  getItemCount(): number {
    return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
  }
}
