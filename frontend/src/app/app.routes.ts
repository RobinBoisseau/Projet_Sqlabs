import { Routes } from '@angular/router';
import { HomeComponent } from './components/home-page/home-page.component'
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';
import { ExerciceDetailComponent } from './components/exercice-detail/exercice-detail.component';

export const routes: Routes = [
  // Page ds'accueil
  { path: '', component: HomeComponent },
  // Page de la liste
  { path: 'exercices', component: ExerciceListComponent },

  // TA PAGE : On change :id par :slug pour correspondre à ton composant
  { path: 'exercice/:slug', component: ExerciceDetailComponent },

  // Redirection par défaut vers la liste
  { path: '', redirectTo: 'exercices', pathMatch: 'full' },
];