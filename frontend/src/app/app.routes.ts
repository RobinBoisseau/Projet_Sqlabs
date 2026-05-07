import { Routes } from '@angular/router';
import { HomeComponent } from './components/home-page/home-page.component';
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';
import { ExerciceDetailComponent } from './components/exercice-detail/exercice-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Routes publiques
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Routes protégées
  { path: '',              component: HomeComponent,          canActivate: [authGuard] },
  { path: 'exercices',     component: ExerciceListComponent,  canActivate: [authGuard] },
  { path: 'exercice/:slug', component: ExerciceDetailComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' },
];