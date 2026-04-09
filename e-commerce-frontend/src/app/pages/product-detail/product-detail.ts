import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Mesaj yazabilmek için şart!
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule], // FormsModule eklendi
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  product: any = null;
  userQuery: string = ''; // Kullanıcının yazdığı soru
  chatHistory: { role: string, text: string }[] = []; // Sohbet geçmişi
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(Number(id)).subscribe({
        next: (data) => {
          this.product = data;
          this.cdr.detectChanges();
        }
      });
    }
  }

  sendMessage() {
    if (!this.userQuery.trim() || !this.product) return;

    const currentMessage = this.userQuery;
    this.chatHistory.push({ role: 'user', text: currentMessage }); // Soruyu ekrana ekle
    this.userQuery = ''; // Kutuyu temizle
    this.isLoading = true;

    this.productService.askGemini(this.product.id, currentMessage).subscribe({
      next: (res) => {
        this.chatHistory.push({ role: 'ai', text: res.answer }); // Botun cevabını ekle
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.chatHistory.push({ role: 'ai', text: 'Üzgünüm, şu an cevap veremiyorum.' });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}


/*import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // ChangeDetectorRef eklendi
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  product: any = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cdr: ChangeDetectorRef // Radarı (Dürtücüyü) sisteme dahil ettik
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(Number(id)).subscribe({
        next: (data) => {
          this.product = data; 
          this.cdr.detectChanges(); // ANGULAR'I DÜRT VE EKRANI ZORLA GÜNCELLE!
        },
        error: (err) => console.error('Hata:', err)
      });
    }
  }
}*/