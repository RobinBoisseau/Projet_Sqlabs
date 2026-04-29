import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { DependenceLine } from '../../models/dependence-line.model';

@Component({
  selector: 'app-dependence-table',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './dependence-table.component.html',
  styleUrls: ['./dependence-table.component.css']
})
export class DependenceTableComponent {
  lignes: DependenceLine[] = [
    new DependenceLine("1", [], []),
    new DependenceLine("2", [], []),
    new DependenceLine("3", [], [])
  ];

  onDrop(event: CdkDragDrop<string[]>, list: string[]) {
    const data = event.item.data;
    if (data && !list.includes(data)) {
      list.push(data);
    }
  }

  removeAtribut(list: string[], index: number) {
    list.splice(index, 1);
  }

  ajouterDependance() {
    this.lignes.push(new DependenceLine(Date.now().toString(), [], []));
  }

  supprimerLigne(index: number) {
    this.lignes.splice(index, 1);
  }

  dupliquerLigne(index: number) {
    const source = this.lignes[index];
    // On crée une nouvelle ligne avec les mêmes données
    const copie = new DependenceLine(
      Date.now().toString(), // Un ID unique basé sur le temps
      [...source.source],     // On copie le tableau des déterminants
      [...source.cible]       // On copie le tableau des déterminés
    );
    this.lignes.push(copie);
  }
}