import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DependenceLine } from '../../models/dependence-line.model';

@Component({
  selector: 'app-dependence-table',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './dependence-table.component.html',
  styleUrls: ['./dependence-table.component.css']
})
export class DependenceTableComponent {
  // Liste des DFs (on commence avec 4 lignes vides)
  lignes: DependenceLine[] = [
    new DependenceLine("1", [], []),
    new DependenceLine("2", [], []),
  ];

  // Fonction pour supprimer un attribut d'une case (la petite croix)
  removeAtribut(liste: string[], index: number) {
    liste.splice(index, 1);
  }


  onDrop(event: CdkDragDrop<string[]>, targetList: string[]) {
    // On récupère la valeur (ex: "PSG")
    const data = event.item.data;
    
    if (data && !targetList.includes(data)) {
      targetList.push(data);
    }
  }

  ajouterDependence() {
    this.lignes.push(new DependenceLine((this.lignes.length + 1).toString(), [], []));
  }
}