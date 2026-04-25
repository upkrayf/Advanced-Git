import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { CartService } from '../../../../core/services/cart';
import { ProductModel } from '../../../../core/models/product.model';
import { CategoryModel } from '../../../../core/models/category.model';

@Component({
  selector: 'app-product-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './product-browse.html',
  styleUrl: './product-browse.css'
})
export class ProductBrowse implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sentinel') sentinelRef!: ElementRef;

  products: ProductModel[] = [];
  categories: CategoryModel[] = [];
  loading = false;
  search = '';
  selectedCategory = 0;
  sortBy: 'price_asc' | 'price_desc' | 'rating' = 'rating';
  page = 0;
  size = 40;
  totalElements = 0;
  totalPages = 0;
  cartSuccess = '';
  loadingMore = false;

  private observer!: IntersectionObserver;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.loadingMore && !this.loading) {
          this.loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    if (this.sentinelRef) {
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (d) => {
        this.categories = d;
        this.cdr.detectChanges();
      },
      error: () => {
        this.categories = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadProducts(append = false): void {
    if (!append) {
      this.page = 0;
      this.products = [];
      this.totalPages = 0;
      this.totalElements = 0;
    }
    this.loading = !append;
    this.loadingMore = append;

    this.productService.getProducts({
      page: this.page,
      size: this.size,
      search: this.search.trim() || undefined,
      categoryId: this.selectedCategory > 0 ? this.selectedCategory : undefined
    }).subscribe({
      next: (d) => {
        this.totalElements = d.totalElements;
        this.totalPages = d.totalPages;
        this.products = append ? [...this.products, ...d.content] : d.content;
        this.loading = false;
        this.loadingMore = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (!append) { this.products = []; this.totalElements = 0; this.totalPages = 0; }
        this.loading = false;
        this.loadingMore = false;
        this.cdr.detectChanges();
      }
    });
  }

  addToCart(product: ProductModel, event: Event): void {
    event.stopPropagation();
    this.cartService.addItem(product);
    this.cartSuccess = product.name;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cartSuccess = '';
      this.cdr.detectChanges();
    }, 2000);
  }

  onSearch(): void { this.page = 0; this.loadProducts(false); }

  loadMore(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadProducts(true);
    }
  }

  get hasMore(): boolean { return this.page < this.totalPages - 1; }

  getStars(rating: number): number[] { return [1, 2, 3, 4, 5]; }
  formatCurrency(v: number): string { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2 }); }

  get sortedProducts(): ProductModel[] {
    const arr = [...this.products];
    if (this.sortBy === 'price_asc') return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (this.sortBy === 'price_desc') return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  getProductImage(p: any): string {
    if (p.imageUrl && p.imageUrl.startsWith('http') && !p.imageUrl.includes('placeholder')) return p.imageUrl;
    
    const cat = (p.categoryName || '').toLowerCase();
    let query = 'product';
    if (cat.includes('elect') || cat.includes('tech')) query = 'tech,laptop,gadget';
    else if (cat.includes('cloth') || cat.includes('fashion')) query = 'fashion,clothes';
    else if (cat.includes('home') || cat.includes('furni')) query = 'interior,furniture';
    else if (cat.includes('food')) query = 'food,gourmet';
    else if (cat.includes('sport')) query = 'fitness,sports';
    
    // Using a reliable placeholder service with category keywords and unique signature for variety
    return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80&sig=${p.id}`; 
    // Ideally we'd use source.unsplash.com/featured but Unsplash deprecated it. 
    // We'll stick to our fallback system in HTML for maximum reliability.
  }

  getCategoryIcon(catName: string): string {
    const cat = (catName || '').toLowerCase();
    if (cat.includes('elect')) return '💻';
    if (cat.includes('cloth')) return '👕';
    if (cat.includes('home')) return '🏠';
    if (cat.includes('food')) return '🍕';
    if (cat.includes('sport')) return '⚽';
    if (cat.includes('book')) return '📚';
    return '📦';
  }
}
