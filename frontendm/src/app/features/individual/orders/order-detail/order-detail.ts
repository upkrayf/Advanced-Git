import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { OrderService } from '../../../../core/services/order';
import { OrderModel, OrderItemModel } from '../../../../core/models/order.model';

@Component({
  selector: 'app-individual-order-detail',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class IndividualOrderDetail implements OnInit {
  order: OrderModel | null = null;
  loading = false;

  constructor(private orderService: OrderService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = +(this.route.snapshot.paramMap.get('id') || 0);
    if (!id) return;
    this.loading = true;
    this.orderService.getOrder(id).subscribe({
      next: (d) => { this.order = this.normalize(d); this.loading = false; },
      error: () => {
        this.order = this.normalize({
          id, storeName: 'DataPulse Store', totalAmount: 1448, status: 'SHIPPED',
          shippingAddress: 'Kızılay Mah. Atatürk Cad. No:5, Ankara 06100',
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

  private normalize(raw: any): OrderModel {
    const items: OrderItemModel[] = (raw.items || []).map((item: any) => {
      const name    = item.productName ?? item.product?.name ?? item.product?.sku ?? 'Ürün';
      const price   = +(item.unitPrice ?? item.price ?? item.product?.unitPrice ?? 0);
      const qty     = +(item.quantity ?? 1);
      return { id: item.id, productId: item.productId ?? item.product?.id ?? 0,
               productName: name, quantity: qty, unitPrice: price,
               subtotal: +(item.subtotal ?? (price * qty).toFixed(2)),
               product: item.product, price: item.price };
    });
    return {
      id: raw.id,
      orderNumber: raw.orderNumber,
      customerName: raw.customerName ?? raw.user?.fullName ?? '-',
      customerEmail: raw.customerEmail ?? raw.user?.email ?? '-',
      storeName: raw.storeName ?? 'DataPulse Store',
      totalAmount: +(raw.totalAmount ?? 0),
      status: raw.status ?? 'PENDING',
      shippingAddress: raw.shippingAddress ?? null,
      createdAt: raw.createdAt ?? raw.orderDate ?? '',
      items,
    };
  }

  /* 0=no step, 1=Alındı, 2=Onaylandı, 3=Kargoda, 4=Dağıtımda, 5=Teslim */
  getStatusProgress(status: string): number {
    const m: Record<string, number> = {
      PLACED: 1, PENDING: 1, CONFIRMED: 2, SHIPPED: 3,
      OUT_FOR_DELIVERY: 4, DELIVERED: 5, CANCELLED: 0, RETURNED: 0
    };
    return m[status] ?? 0;
  }

  isCancelled(status: string): boolean {
    return status === 'CANCELLED' || status === 'RETURNED';
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      DELIVERED: 'pill-green', CONFIRMED: 'pill-green',
      PLACED: 'pill-amber', SHIPPED: 'pill-amber', PENDING: 'pill-amber', OUT_FOR_DELIVERY: 'pill-amber',
      CANCELLED: 'pill-red', RETURNED: 'pill-red'
    };
    return m[s] || '';
  }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = {
      PLACED: 'Alındı', DELIVERED: 'Teslim Edildi', SHIPPED: 'Kargoda',
      PENDING: 'Beklemede', CONFIRMED: 'Onaylandı', OUT_FOR_DELIVERY: 'Dağıtımda',
      CANCELLED: 'İptal Edildi', RETURNED: 'İade'
    };
    return l[s] || s;
  }

  formatCurrency(v: number): string {
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 });
  }
}
