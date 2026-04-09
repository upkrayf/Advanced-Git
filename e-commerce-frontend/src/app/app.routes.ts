import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { ProductListComponent } from './pages/product-list/product-list';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Dashboard } from './pages/dashboard/dashboard';
import { Orders } from './pages/orders/orders';
import { Customers } from './pages/customers/customers';
import { Shipments } from './pages/shipments/shipments';
import { AiAssistant } from './pages/ai-assistant/ai-assistant';
import { Analytics } from './pages/analytics/analytics';
import { Reviews } from './pages/reviews/reviews';
import { Settings } from './pages/settings/settings';



export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Site ilk açıldığında login'e atar
  { path: 'login', component: Login },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetail }, 
  { path: 'dashboard', component: Dashboard },
  { path: 'orders', component: Orders },
  { path: 'customers', component: Customers },
  { path: 'shipments', component: Shipments },
  { path: 'ai-assistant', component: AiAssistant },
  { path: 'analytics', component: Analytics },
  { path: 'reviews', component: Reviews },
  { path: 'settings', component: Settings },
  
];


