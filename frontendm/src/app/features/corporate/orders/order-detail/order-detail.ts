import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { OrderService } from '../../../../core/services/order';
import { OrderModel, OrderItemModel } from '../../../../core/models/order.model';

@Component({
  selector: 'app-corporate-order-detail',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class CorporateOrderDetail implements OnInit {
  order: OrderModel | null = null;
  loading = false;
  toast = '';
  toastType: 'success' | 'error' = 'success';
  updating = false;

  constructor(private orderService: OrderService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = +(this.route.snapshot.paramMap.get('id') || 0);
    if (!id) return;
    this.loading = true;
    this.orderService.getOrder(id).subscribe({
      next: (d) => { this.order = this.normalizeOrder(d); this.loading = false; },
      error: () => {
        this.order = this.normalizeOrder({
          id,
          customerName: 'Zeynep Kaya',
          customerEmail: 'zeynep@gmail.com',
          totalAmount: 1448,
          status: 'SHIPPED',
          shippingAddress: 'Çankaya, Ankara',
          createdAt: '2026-04-10T14:32:00',
          items: [
            { id: 1, productId: 1, productName: 'iPhone 15 Pro', quantity: 1, unitPrice: 1199, subtotal: 1199 },
            { id: 2, productId: 2, productName: 'AirPods Pro',   quantity: 1, unitPrice: 249,  subtotal: 249  },
          ]
        });
        this.loading = false;
      }
    });
  }

  /** Backend'den gelen ham Order'ı frontend modeline normalize eder */
  private normalizeOrder(raw: any): OrderModel {
    const items: OrderItemModel[] = (raw.items || []).map((item: any) => {
      const productName: string =
        item.productName ?? item.product?.name ?? item.product?.sku ?? 'Ürün';
      const unitPrice: number =
        +(item.unitPrice ?? item.price ?? item.product?.unitPrice ?? 0);
      const qty: number = +(item.quantity ?? 1);
      return {
        id:          item.id,
        productId:   item.productId ?? item.product?.id ?? 0,
        productName,
        quantity:    qty,
        unitPrice,
        subtotal:    +(item.subtotal ?? (unitPrice * qty).toFixed(2)),
        product:     item.product,
        price:       item.price,
      };
    });

    return {
      id:              raw.id,
      orderNumber:     raw.orderNumber,
      customerName:    raw.customerName ?? raw.user?.fullName ?? raw.user?.email ?? '-',
      customerEmail:   raw.customerEmail ?? raw.user?.email ?? '-',
      storeName:       raw.storeName,
      totalAmount:     +(raw.totalAmount ?? 0),
      status:          raw.status ?? 'PENDING',
      shippingAddress: raw.shippingAddress ?? raw.user?.address ?? null,
      createdAt:       raw.createdAt ?? raw.orderDate ?? '',
      items,
    };
  }

  updateStatus(status: string): void {
    if (!this.order || this.updating) return;
    this.updating = true;
    this.orderService.updateStatus(this.order.id, status).subscribe({
      next: (d) => {
        if (this.order) this.order.status = d.status ?? status;
        this.updating = false;
        this.showToast('Sipariş durumu güncellendi.', 'success');
      },
      error: () => {
        this.updating = false;
        this.showToast('Güncelleme başarısız. Tekrar deneyin.', 'error');
      }
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  canConfirm():  boolean { return !!this.order && ['PLACED', 'PENDING'].includes(this.order.status); }
  canShip():     boolean { return !!this.order && this.order.status === 'CONFIRMED'; }
  canDeliver():  boolean { return !!this.order && this.order.status === 'SHIPPED'; }
  canCancel():   boolean { return !!this.order && !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(this.order.status); }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { DELIVERED: 'pill-green', CONFIRMED: 'pill-green', PLACED: 'pill-amber', SHIPPED: 'pill-amber', PENDING: 'pill-amber', CANCELLED: 'pill-red', RETURNED: 'pill-red' };
    return m[s] || '';
  }
  getStatusLabel(s: string): string {
    const l: Record<string, string> = { PLACED: 'Alındı', DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda', PENDING: 'Beklemede', CONFIRMED: 'Onaylandı', CANCELLED: 'İptal', RETURNED: 'İade' };
    return l[s] || s;
  }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
