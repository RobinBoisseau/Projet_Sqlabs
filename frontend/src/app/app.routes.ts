import { Routes } from '@angular/router';
import { ExerciceListComponent } from './components/exercice-list/exercice-list.component';

export const routes: Routes = [
  { path: 'exercices', component: ExerciceListComponent },
  { path: '', redirectTo: 'exercices', pathMatch: 'full' }
];