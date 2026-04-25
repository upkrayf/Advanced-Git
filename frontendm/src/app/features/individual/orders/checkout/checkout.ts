import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { CartService } from '../../../../core/services/cart';
import { OrderService } from '../../../../core/services/order';

const TR_CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin',
  'Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale',
  'Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum',
  'Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Isparta','Mersin',
  'İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli',
  'Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas',
  'Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat',
  'Zonguldak','Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak','Bartın',
  'Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce'
];

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

  // Validation errors
  errors: Record<string, string> = {};

  // City autocomplete
  cityQuery = '';
  citySuggestions: string[] = [];
  showCitySuggestions = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  get items() { return this.cartService.getItems(); }
  get total() { return this.cartService.getTotal(); }

  // --- City autocomplete ---
  onCityInput(): void {
    const q = this.cityQuery.trim().toLowerCase();
    if (q.length < 1) { this.citySuggestions = []; this.showCitySuggestions = false; return; }
    this.citySuggestions = TR_CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
    this.showCitySuggestions = this.citySuggestions.length > 0;
  }

  selectCity(c: string): void {
    this.city = c;
    this.cityQuery = c;
    this.citySuggestions = [];
    this.showCitySuggestions = false;
    delete this.errors['city'];
  }

  @HostListener('document:click')
  closeSuggestions(): void { this.showCitySuggestions = false; }

  // --- Validation ---
  private validate(): boolean {
    this.errors = {};
    const addr = this.address.trim();
    if (!addr) {
      this.errors['address'] = 'Adres zorunludur.';
    } else if (addr.length < 10) {
      this.errors['address'] = 'Adres en az 10 karakter olmalıdır (mahalle, cadde, no).';
    } else if (!/\d/.test(addr)) {
      this.errors['address'] = 'Adres bina/daire numarası içermelidir.';
    }

    if (!this.city.trim()) {
      this.errors['city'] = 'Şehir seçimi zorunludur.';
    } else if (!TR_CITIES.includes(this.city.trim())) {
      this.errors['city'] = 'Geçerli bir Türkiye şehri seçin.';
    }

    const pc = this.postalCode.trim();
    if (pc && !/^\d{5}$/.test(pc)) {
      this.errors['postalCode'] = 'Posta kodu 5 haneli rakam olmalıdır.';
    }

    if (!this.paymentMethod) {
      this.errors['payment'] = 'Ödeme yöntemi seçin.';
    }

    if (!this.items.length) {
      this.errors['cart'] = 'Sepetiniz boş.';
    }

    return Object.keys(this.errors).length === 0;
  }

  placeOrder(): void {
    this.error = '';
    if (!this.validate()) return;

    const checkoutData = {
      paymentMethod: this.paymentMethod,
      shippingAddress: `${this.address.trim()}, ${this.city.trim()}${this.postalCode ? ' ' + this.postalCode : ''}`,
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
        setTimeout(() => this.router.navigate(['/individual/orders']), 2500);
      },
      error: (err) => {
        this.error = 'Sipariş oluşturulamadı: ' + (err.error?.message || 'Tekrar deneyin.');
        this.loading = false;
      }
    });
  }

  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
}
