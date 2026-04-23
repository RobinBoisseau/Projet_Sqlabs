import { Routes } from '@angular/router';
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';
import { ExerciceDetailComponent } from './components/exercice-detail/exercice-detail.component';

export const routes: Routes = [
  { path: 'exercices', component: ExerciceListComponent },
  
  // Correction : Ajout de la virgule après 'full' }
  { path: '', redirectTo: 'exercices', pathMatch: 'full' }, 
  
  { path: 'exercice/:id', component: ExerciceDetailComponent },
];