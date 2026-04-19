import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { ProductService } from '../../../../core/services/product';
import { CategoryService } from '../../../../core/services/category';
import { ProductModel } from '../../../../core/models/product.model';
import { CategoryModel } from '../../../../core/models/category.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit {
  product: Partial<ProductModel> = { name: '', description: '', price: 0, stock: 0, imageUrl: '', categoryId: undefined, isActive: true };
  categories: CategoryModel[] = [];
  editMode = false;
  productId: number | null = null;
  loading = false;
  error = '';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (d) => this.categories = d,
      error: () => this.categories = [
        { id: 1, name: 'Elektronik' }, { id: 2, name: 'Giyim' },
        { id: 3, name: 'Ev & Yaşam' }, { id: 4, name: 'Kitap' }
      ]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.editMode = true;
      this.productId = +id;
      this.productService.getProduct(+id).subscribe({
        next: (d) => this.product = { ...d },
        error: () => { this.error = 'Ürün yüklenemedi.'; }
      });
    }
  }

  save(): void {
    if (!this.product.name || !this.product.price) {
      this.error = 'Ürün adı ve fiyatı zorunludur.';
      return;
    }
    this.loading = true;
    const obs = this.editMode && this.productId
      ? this.productService.updateProduct(this.productId, this.product)
      : this.productService.createProduct(this.product);

    obs.subscribe({
      next: () => { this.loading = false; this.router.navigate(['/corporate/products']); },
      error: () => { this.error = 'Kayıt başarısız. Tekrar deneyin.'; this.loading = false; }
    });
  }
}
