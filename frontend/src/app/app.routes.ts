import { Routes } from '@angular/router';
import { HomeComponent } from './components/home-page/home-page.component';
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';
import { ExerciceDetailComponent } from './components/exercice-detail/exercice-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { UserListComponent } from './components/admin/user-list/user-list.component';
import { UserEditComponent } from './components/admin/user-edit/user-edit.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Routes publiques
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Routes protégées utilisateur
  { path: '',               component: HomeComponent,           canActivate: [authGuard] },
  { path: 'exercices',      component: ExerciceListComponent,   canActivate: [authGuard] },
  { path: 'exercice/:slug', component: ExerciceDetailComponent, canActivate: [authGuard] },

  // Routes admin
  { path: 'admin',                component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/users',          component: UserListComponent,       canActivate: [adminGuard] },
  { path: 'admin/users/:id/edit', component: UserEditComponent,       canActivate: [adminGuard] },

  { path: '**', redirectTo: 'login' },
];
