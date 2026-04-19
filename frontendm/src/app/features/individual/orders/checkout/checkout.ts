import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { CartService } from '../../../../core/services/cart';
import { OrderService } from '../../../../core/services/order';
import { CreateOrderRequest } from '../../../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit {
  address = '';
  city = '';
  postalCode = '';
  loading = false;
  error = '';
  success = false;

  constructor(private cartService: CartService, private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {}

  get items() { return this.cartService.getItems(); }
  get total() { return this.cartService.getTotal(); }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  placeOrder(): void {
    if (!this.address || !this.city) { this.error = 'Adres bilgilerini doldurun.'; return; }
    if (!this.items.length) { this.error = 'Sepetiniz boş.'; return; }

    const storeId = this.items[0]?.product.storeId || 1;
    const orderRequest: CreateOrderRequest = {
      storeId,
      items: this.items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      shippingAddress: `${this.address}, ${this.city} ${this.postalCode}`
    };

    this.loading = true;
    this.orderService.createOrder(orderRequest).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/individual/orders']), 2000);
      },
      error: () => {
        this.error = 'Sipariş oluşturulamadı. Tekrar deneyin.';
        this.loading = false;
      }
    });
  }
}
