import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { CartService, CartItem } from '../../../../core/services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  items: CartItem[] = [];

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(items => this.items = items);
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
  }

  updateQty(productId: number, qty: number): void {
    if (qty < 1) { this.removeItem(productId); return; }
    this.cartService.updateQuantity(productId, qty);
  }

  clearCart(): void {
    if (confirm('Sepeti temizlemek istiyor musunuz?')) {
      this.cartService.clearCart();
    }
  }

  get total(): number { return this.cartService.getTotal(); }
  get itemCount(): number { return this.cartService.getItemCount(); }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
