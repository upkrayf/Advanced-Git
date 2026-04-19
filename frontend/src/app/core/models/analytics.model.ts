export interface RevenuePoint {
  label: string;
  value: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface CategorySales {
  categoryName: string;
  totalRevenue: number;
  percentage: number;
}

export interface PlatformKpis {
  totalUsers: number;
  totalStores: number;
  totalOrders: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  newOrdersToday: number;
  suspendedAccounts: number;
  activeStores: number;
}

export interface CorporateKpis {
  totalRevenue: number;
  ordersToday: number;
  avgOrderValue: number;
  pendingShipments: number;
  lowStockItems: number;
  totalProducts: number;
}

export interface IndividualStats {
  totalSpent: number;
  activeOrders: number;
  totalOrders: number;
  pendingReviews: number;
  savedAmount: number;
}

export interface SpendingByCategory {
  categoryName: string;
  amount: number;
}

export interface AuditLog {
  id: number;
  userId: number;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}
