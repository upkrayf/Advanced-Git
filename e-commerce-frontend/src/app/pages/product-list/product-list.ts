import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  
  // Kontrol Değişkenleri
  searchText: string = ''; 
  sortOption: string = 'default'; 
  selectedCategory: string = 'All Categories'; // Kategori filtresi eklendi

  constructor(
    private productService: ProductService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (data: any) => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Veri çekme hatası:", err)
    });
  }

  // Ekrana verileri basmadan önce filtreleyen ve sıralayan sihirli metod
  get filteredAndSortedProducts() {
    let result = this.products;

    // 1. KATEGORİ FİLTRELEMESİ (Yeni Eklendi)
    if (this.selectedCategory !== 'All Categories') {
      // Backend'den 'category', 'categoryName' veya 'category_id' olarak gelebilir. 
      // Hangi isimle geliyorsa ona göre süzer.
      result = result.filter(p => 
        (p.category && p.category === this.selectedCategory) || 
        (p.categoryName && p.categoryName === this.selectedCategory)
      );
    }

    // 2. ARAMA FİLTRELEMESİ
    if (this.searchText.trim()) {
      const lowerSearch = this.searchText.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerSearch));
    }

    // 3. SIRALAMA İŞLEMİ
    if (this.sortOption === 'price-asc') {
      result = result.sort((a, b) => (a.unit_price || a.price) - (b.unit_price || b.price)); 
    } else if (this.sortOption === 'price-desc') {
      result = result.sort((a, b) => (b.unit_price || b.price) - (a.unit_price || a.price));
    } else if (this.sortOption === 'name-asc') {
      result = result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }

  goToDetail(id: number): void {
    this.router.navigate(['/products', id]);
  }
}