import { Routes } from '@angular/router';
import { HomeComponent } from './components/home-page/home-page.component';
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';
import { ExerciceDetailComponent } from './components/exercice-detail/exercice-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { UserListComponent } from './components/admin/user-list/user-list.component';
import { UserEditComponent } from './components/admin/user-edit/user-edit.component';
import { ClassListComponent } from './components/classes/class-list/class-list.component';
import { ClassCreateComponent } from './components/classes/class-create/class-create.component';
import { ClassLayoutComponent } from './components/classes/class-layout/class-layout.component';
import { ClassDetailComponent } from './components/classes/class-detail/class-detail.component';
import { ClassMembersComponent } from './components/classes/class-members/class-members.component';
import { ClassEditComponent } from './components/classes/class-edit/class-edit.component';
import { ClassExercisesComponent } from './components/classes/class-exercises/class-exercises.component';
import { ClassProgressIndividualComponent } from './components/classes/class-progress-individual/class-progress-individual.component';
import { ClassProgressGlobalComponent } from './components/classes/class-progress-global/class-progress-global.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { teacherGuard } from './guards/teacher.guard';

export const routes: Routes = [
  // Routes publiques
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Routes protégées utilisateur
  { path: '',               component: HomeComponent,           canActivate: [authGuard] },
  { path: 'exercices',      component: ExerciceListComponent,   canActivate: [authGuard] },
  { path: 'exercice/:slug', component: ExerciceDetailComponent, canActivate: [authGuard] },
  { path: 'profile',        component: ProfileComponent,        canActivate: [authGuard] },

  // Routes admin
  { path: 'admin',                component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/users',          component: UserListComponent,       canActivate: [adminGuard] },
  { path: 'admin/users/:id/edit', component: UserEditComponent,       canActivate: [adminGuard] },

  // Routes classes (professeur + admin)
  { path: 'classes',        component: ClassListComponent,   canActivate: [teacherGuard] },
  { path: 'classes/create', component: ClassCreateComponent, canActivate: [teacherGuard] },
  {
    path: 'classes/:id',
    component: ClassLayoutComponent,
    canActivate: [teacherGuard],
    children: [
      { path: '',                    component: ClassDetailComponent },
      { path: 'members',             component: ClassMembersComponent },
      { path: 'edit',                component: ClassEditComponent },
      { path: 'exercises',           component: ClassExercisesComponent },
      { path: 'progress/individual', component: ClassProgressIndividualComponent },
      { path: 'progress/global',     component: ClassProgressGlobalComponent },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
