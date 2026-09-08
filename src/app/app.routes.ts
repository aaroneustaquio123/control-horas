import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'empleados',
        loadComponent: () =>
          import('./features/empleados/empleados.component').then(m => m.EmpleadosComponent)
      },
      {
        path: 'registros',
        loadComponent: () =>
          import('./features/registros/registros.component').then(m => m.RegistrosComponent)
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
