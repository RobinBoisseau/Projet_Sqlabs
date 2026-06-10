import { Routes } from '@angular/router';
import { IaChatComponent } from './components/ia-chat/ia-chat.component';
import { HomeComponent } from './components/home-page/home-page.component';
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';
import { ExerciceDetailComponent } from './components/exercice-detail/exercice-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { UserListComponent } from './components/admin/user-list/user-list.component';
import { UserEditComponent } from './components/admin/user-edit/user-edit.component';
import { CoursListComponent } from './components/admin/cours-list/cours-list.component';
import { CoursLayoutComponent } from './components/admin/cours-layout/cours-layout.component';
import { CoursDetailComponent } from './components/admin/cours-detail/cours-detail.component';
import { CoursEditComponent } from './components/admin/cours-edit/cours-edit.component';
import { CoursDeleteComponent } from './components/admin/cours-delete/cours-delete.component';
import { CoursExercicesComponent } from './components/admin/cours-exercices/cours-exercices.component';
import { ClassListComponent } from './components/classes/class-list/class-list.component';
import { ClassCreateComponent } from './components/classes/class-create/class-create.component';
import { ClassLayoutComponent } from './components/classes/class-layout/class-layout.component';
import { ClassDetailComponent } from './components/classes/class-detail/class-detail.component';
import { ClassMembersComponent } from './components/classes/class-members/class-members.component';
import { ClassEditComponent } from './components/classes/class-edit/class-edit.component';
import { ClassExercisesComponent } from './components/classes/class-exercises/class-exercises.component';
import { ClassProgressIndividualComponent } from './components/classes/class-progress-individual/class-progress-individual.component';
import { ClassProgressGlobalComponent } from './components/classes/class-progress-global/class-progress-global.component';
import { ClassDeleteComponent } from './components/classes/class-delete/class-delete.component';
import { ClassExerciceDetailComponent } from './components/classes/class-exercice-detail/class-exercice-detail.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { teacherGuard } from './guards/teacher.guard';
import { ExerciceAdminListComponent } from './components/admin/exercice-list/exercice-admin-list.component';
import { ExerciceCreateComponent } from './components/admin/exercice-create/exercice-create.component';
import { ExerciceEditComponent } from './components/admin/exercice-edit/exercice-edit.component';
import { TentativesTestablesComponent } from './components/admin/tentatives-testables/tentatives-testables.component';
import { PromptListComponent } from './components/admin/prompt-list/prompt-list.component';
import { PromptCreateComponent } from './components/admin/prompt-create/prompt-create.component';

export const routes: Routes = [
  // Routes publiques
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Routes protégées utilisateur
  { path: '',               component: HomeComponent,           canActivate: [authGuard] },
  { path: 'exercices',      component: ExerciceListComponent,   canActivate: [authGuard] },
  { path: 'cours/:id',      component: ExerciceListComponent,   canActivate: [authGuard] },
  { path: 'exercice/:slug', component: ExerciceDetailComponent, canActivate: [authGuard] },
  { path: 'profile',        component: ProfileComponent,        canActivate: [authGuard] },
  { path: 'ia',             component: IaChatComponent,         canActivate: [authGuard] },

  // Routes admin
  { path: 'admin',                component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/users',          component: UserListComponent,       canActivate: [adminGuard] },
  { path: 'admin/users/:id/edit', component: UserEditComponent,       canActivate: [adminGuard] },
  { path: 'admin/cours',          component: CoursListComponent,      canActivate: [adminGuard] },
  { path: 'admin/exercices', component: ExerciceAdminListComponent, canActivate: [adminGuard] },
  { path: 'admin/exercices/create', component: ExerciceCreateComponent, canActivate: [adminGuard] },
  { path: 'admin/exercices/:slug/edit', component: ExerciceEditComponent, canActivate: [teacherGuard] },
  { path: 'admin/exercices/:slug/tentatives-testables', component: TentativesTestablesComponent, canActivate: [adminGuard] },
  { path: 'admin/prompts',             component: PromptListComponent,   canActivate: [adminGuard] },
  { path: 'admin/prompts/create',      component: PromptCreateComponent, canActivate: [adminGuard] },
  { path: 'admin/prompts/:id/edit',    component: PromptCreateComponent, canActivate: [adminGuard] },
  {
    path: 'admin/cours/:id',
    component: CoursLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '',           component: CoursDetailComponent },
      { path: 'edit',       component: CoursEditComponent },
      { path: 'delete',     component: CoursDeleteComponent },
      { path: 'exercices',  component: CoursExercicesComponent },
    ],
  },

  // Routes classes (professeur + admin)
  { path: 'classes',        component: ClassListComponent,   canActivate: [teacherGuard] },
  { path: 'classes/create', component: ClassCreateComponent, canActivate: [teacherGuard] },
  {
    path: 'classes/:id',
    component: ClassLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '',                    component: ClassDetailComponent },
      { path: 'exercises',           component: ClassExercisesComponent },
      { path: 'members',             component: ClassMembersComponent,             canActivate: [teacherGuard] },
      { path: 'edit',                component: ClassEditComponent,                canActivate: [teacherGuard] },
      { path: 'progress/individual', component: ClassProgressIndividualComponent,  canActivate: [teacherGuard] },
      { path: 'progress/global',     component: ClassProgressGlobalComponent,      canActivate: [teacherGuard] },
      { path: 'delete',              component: ClassDeleteComponent,              canActivate: [teacherGuard] },
    ],
  },

  { path: 'classes/:id/exercises/:slug/details', component: ClassExerciceDetailComponent, canActivate: [teacherGuard] },

  { path: '**', redirectTo: 'login' },
];
