export interface UserModel {
  id: number;
  name: string;
  email: string;
  password?: string;
  roleType: 'ADMIN' | 'CORPORATE' | 'INDIVIDUAL';
  phone?: string;
  city?: string;
  isActive?: boolean;
  createdAt?: string;
  profileImage?: string;
}

export interface UserPageResponse {
  content: UserModel[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleType: string;
  phone?: string;
}
