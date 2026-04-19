import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { CategoryService } from '../../../core/services/category';
import { CategoryModel, CreateCategoryRequest } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, RouterModule],
  templateUrl: './category-management.html',
  styleUrl: './category-management.css'
})
export class CategoryManagement implements OnInit {
  categories: CategoryModel[] = [];
  loading = false;
  showModal = false;
  editMode = false;
  selectedId: number | null = null;
  formData: CreateCategoryRequest = { name: '', description: '', parentId: undefined };
  formError = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (data) => { this.categories = data; this.loading = false; },
      error: () => {
        this.categories = [
          { id: 1, name: 'Elektronik', productCount: 315, createdAt: '2026-01-01' },
          { id: 2, name: 'Giyim', productCount: 210, parentId: undefined, createdAt: '2026-01-01' },
          { id: 3, name: 'Ev & Yaşam', productCount: 178, createdAt: '2026-01-01' },
          { id: 4, name: 'Kitap', productCount: 560, createdAt: '2026-01-01' },
          { id: 5, name: 'Spor', productCount: 134, createdAt: '2026-01-01' },
          { id: 6, name: 'Telefon', productCount: 98, parentId: 1, parentName: 'Elektronik', createdAt: '2026-01-05' },
          { id: 7, name: 'Bilgisayar', productCount: 87, parentId: 1, parentName: 'Elektronik', createdAt: '2026-01-05' },
        ];
        this.loading = false;
      }
    });
  }

  openCreate(): void {
    this.editMode = false;
    this.selectedId = null;
    this.formData = { name: '', description: '', parentId: undefined };
    this.formError = '';
    this.showModal = true;
  }

  openEdit(cat: CategoryModel): void {
    this.editMode = true;
    this.selectedId = cat.id;
    this.formData = { name: cat.name, description: cat.description || '', parentId: cat.parentId };
    this.formError = '';
    this.showModal = true;
  }

  saveCategory(): void {
    if (!this.formData.name) { this.formError = 'Kategori adı zorunludur.'; return; }
    const obs = this.editMode && this.selectedId
      ? this.categoryService.updateCategory(this.selectedId, this.formData)
      : this.categoryService.createCategory(this.formData);

    obs.subscribe({
      next: () => { this.showModal = false; this.loadCategories(); },
      error: () => { this.formError = 'İşlem başarısız. Tekrar deneyin.'; }
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    this.categoryService.deleteCategory(id).subscribe({
      next: () => { this.categories = this.categories.filter(c => c.id !== id); },
      error: () => alert('Kategori silinemedi.')
    });
  }

  getParentName(cat: CategoryModel): string {
    return cat.parentName || (cat.parentId ? `ID:${cat.parentId}` : '-');
  }
}
