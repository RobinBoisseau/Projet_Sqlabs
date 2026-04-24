import { Routes } from '@angular/router';
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';
import { ExerciceDetailComponent } from './components/exercice-detail/exercice-detail.component';

export const routes: Routes = [
  // Page de la liste (ton collègue)
  { path: 'exercices', component: ExerciceListComponent },

  { path: 'exercice/:slug', component: ExerciceDetailComponent },
  { path: '', redirectTo: 'exercices', pathMatch: 'full' }
];