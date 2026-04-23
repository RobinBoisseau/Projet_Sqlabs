import { Routes } from '@angular/router';
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';
import { ExerciceDetailComponent } from './components/exercice-detail/exercice-detail.component';

export const routes: Routes = [
  // Page de la liste (ton collègue)
  { path: 'exercices', component: ExerciceListComponent },

<<<<<<< HEAD
  // TA PAGE : On change :id par :slug pour correspondre à ton composant
  { path: 'exercice/:slug', component: ExerciceDetailComponent },

  // Redirection par défaut vers la liste
  { path: '', redirectTo: 'exercices', pathMatch: 'full' },
=======
  { path: 'exercice/:slug', component: ExerciceDetailComponent },
  { path: '', redirectTo: 'exercices', pathMatch: 'full' }
>>>>>>> 4c1ce90b0119953c92c83bf3bf93f8cefa80c216
];