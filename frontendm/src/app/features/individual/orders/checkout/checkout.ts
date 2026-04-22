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
  paymentMethod = 'credit_card';
  loading = false;
  error = '';
  success = false;

  constructor(private cartService: CartService, private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {}

  get items() { return this.cartService.getItems(); }
  get total() { return this.cartService.getTotal(); }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  placeOrder(): void {
    if (!this.address?.trim() || !this.city?.trim()) { this.error = 'Lütfen adres ve şehir bilgilerinizi doldurun.'; return; }
    if (!this.paymentMethod) { this.error = 'Ödeme yöntemi seçin.'; return; }
    if (!this.items.length) { this.error = 'Sepetiniz boş.'; return; }

    const checkoutData = {
      paymentMethod: this.paymentMethod,
      items: this.items.map(i => ({ 
        productId: i.product.id, 
        quantity: i.quantity,
        price: i.product.unitPrice || i.product.price || 0
      }))
    };

    this.loading = true;
    this.orderService.checkout(checkoutData).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/individual/dashboard']), 2000);
      },
      error: (err) => {
        this.error = 'Sipariş oluşturulamadı: ' + (err.error?.message || 'Tekrar deneyin.');
        this.loading = false;
      }
    });
  }
}
