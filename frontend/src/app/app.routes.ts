import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin-guard';
import { corporateGuard } from './core/guards/corporate-guard';
import { individualGuard } from './core/guards/individual-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.Login)
  },

  // ─── ADMIN ──────────────────────────────────────────────────────────────────
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.AdminDashboard),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/user-management',
    loadComponent: () => import('./features/admin/user-management/user-management').then(m => m.UserManagement),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/store-management',
    loadComponent: () => import('./features/admin/store-management/store-management').then(m => m.StoreManagement),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/category-management',
    loadComponent: () => import('./features/admin/category-management/category-management').then(m => m.CategoryManagement),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/platform-analytics',
    loadComponent: () => import('./features/admin/platform-analytics/platform-analytics').then(m => m.PlatformAnalytics),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/audit-logs',
    loadComponent: () => import('./features/admin/audit-logs/audit-logs').then(m => m.AuditLogs),
    canActivate: [adminGuard]
  },

  // ─── CORPORATE ──────────────────────────────────────────────────────────────
  {
    path: 'corporate/dashboard',
    loadComponent: () => import('./features/corporate/dashboard/dashboard').then(m => m.CorporateDashboard),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/products',
    loadComponent: () => import('./features/corporate/products/product-list/product-list').then(m => m.CorporateProductList),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/products/new',
    loadComponent: () => import('./features/corporate/products/product-form/product-form').then(m => m.ProductForm),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/products/:id',
    loadComponent: () => import('./features/corporate/products/product-detail/product-detail').then(m => m.CorporateProductDetail),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/products/:id/edit',
    loadComponent: () => import('./features/corporate/products/product-form/product-form').then(m => m.ProductForm),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/orders',
    loadComponent: () => import('./features/corporate/orders/order-list/order-list').then(m => m.CorporateOrderList),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/orders/:id',
    loadComponent: () => import('./features/corporate/orders/order-detail/order-detail').then(m => m.CorporateOrderDetail),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/inventory',
    loadComponent: () => import('./features/corporate/inventory/inventory').then(m => m.Inventory),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/customers',
    loadComponent: () => import('./features/corporate/customers/customers').then(m => m.Customers),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/analytics',
    loadComponent: () => import('./features/corporate/analytics/analytics').then(m => m.CorporateAnalytics),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/shipments',
    loadComponent: () => import('./features/corporate/shipments/shipments').then(m => m.Shipments),
    canActivate: [corporateGuard]
  },
  {
    path: 'corporate/reviews',
    loadComponent: () => import('./features/corporate/reviews/reviews').then(m => m.CorporateReviews),
    canActivate: [corporateGuard]
  },

  // ─── INDIVIDUAL ─────────────────────────────────────────────────────────────
  {
    path: 'individual/dashboard',
    loadComponent: () => import('./features/individual/dashboard/dashboard').then(m => m.IndividualDashboard),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/shop',
    loadComponent: () => import('./features/individual/shop/product-browse/product-browse').then(m => m.ProductBrowse),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/shop/:id',
    loadComponent: () => import('./features/individual/shop/product-detail/product-detail').then(m => m.IndividualProductDetail),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/cart',
    loadComponent: () => import('./features/individual/shop/cart/cart').then(m => m.Cart),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/orders',
    loadComponent: () => import('./features/individual/orders/order-history/order-history').then(m => m.OrderHistory),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/orders/:id',
    loadComponent: () => import('./features/individual/orders/order-detail/order-detail').then(m => m.IndividualOrderDetail),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/checkout',
    loadComponent: () => import('./features/individual/orders/checkout/checkout').then(m => m.Checkout),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/shipment-tracking',
    loadComponent: () => import('./features/individual/shipment-tracking/shipment-tracking').then(m => m.ShipmentTracking),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/reviews',
    loadComponent: () => import('./features/individual/reviews/reviews').then(m => m.IndividualReviews),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/profile',
    loadComponent: () => import('./features/individual/profile/profile').then(m => m.Profile),
    canActivate: [individualGuard]
  },
  {
    path: 'individual/spending-analytics',
    loadComponent: () => import('./features/individual/spending-analytics/spending-analytics').then(m => m.SpendingAnalytics),
    canActivate: [individualGuard]
  },

  // ─── Public product browsing ─────────────────────────────────────────────────
  {
    path: 'products',
    loadComponent: () => import('./features/products/product-list').then(m => m.ProductList)
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./features/products/product-detail').then(m => m.ProductDetail)
  },

  { path: '**', redirectTo: 'login' }
];