import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-dependence-table',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './dependence-table.component.html',
  styleUrls: ['./dependence-table.component.css'] // Utilise le même style que dict
})
export class DependenceTableComponent {
  dependances: any[] = [{ Entite: '', ChampSource: '', Cible: '' }];

  ajouterDependance() {
    this.dependances.push({ Entite: '', ChampSource: '', Cible: '' });
  }

  onDrop(event: CdkDragDrop<string[]>) {
    // Si ça vient d'une autre liste (le dictionnaire)
    if (event.previousContainer !== event.container) {
      const valeurRecue = event.item.data;

      // On remplit la première ligne qui a le champ source vide
      const ligneLibre = this.dependances.find(d => !d.ChampSource);
      
      if (ligneLibre) {
        ligneLibre.ChampSource = valeurRecue;
      } else {
        // Sinon on crée une nouvelle ligne avec la valeur
        this.dependances.push({ Entite: '', ChampSource: valeurRecue, Cible: '' });
      }
    }
  }
}