export interface UserModel {
  id: number;
  fullName: string;
  email: string;
  password?: string;
  roleType: 'ADMIN' | 'CORPORATE' | 'INDIVIDUAL';
  phone?: string;
  city?: string;
  gender?: string;
  age?: number;
  isActive?: boolean;
  createdAt?: string;
  profileImage?: string;
  // CustomerProfile fields returned by /me endpoint
  membershipType?: string;
  averageRating?: number;
  satisfactionLevel?: string;
}

export interface UserPageResponse {
  content: UserModel[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  roleType: string;
  phone?: string;
}
