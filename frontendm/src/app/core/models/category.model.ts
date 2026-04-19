export interface CategoryModel {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  productCount?: number;
  createdAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: number;
}
