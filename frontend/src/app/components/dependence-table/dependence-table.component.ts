import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Association } from '../../models/associations';

@Component({
  selector: 'app-dependence-table',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './dependence-table.component.html',
  styleUrls: ['./dependence-table.component.css']
})
export class DependenceTableComponent {
  @Input() lignes: Association[] = [];

  onDrop(event: CdkDragDrop<string[]>, list: string[]) {
    const data = event.item.data;
    if (data && !list.includes(data)) {
      list.push(data);
    }
  }

  // Cette fonction manquait dans ton erreur
  removeAtribut(list: string[], index: number) {
    list.splice(index, 1);
  }

  nettoyerChampSupprime(nomTechnique: string) {
    this.lignes.forEach(l => {
      // @ts-ignore : On force car le modèle va être mis à jour
      l.source = l.source?.filter((a: any) => a !== nomTechnique);
      // @ts-ignore
      l.cible = l.cible?.filter((a: any) => a !== nomTechnique);
    });
  }

  ajouterDependance() {
    // @ts-ignore
    this.lignes.push({ id: Date.now(), name: '', source: [], cible: [], participations: [], fields: [] });
  }

  supprimerLigne(index: number) {
    this.lignes.splice(index, 1);
  }

  // Cette fonction manquait aussi
  dupliquerLigne(index: number) {
    const s = this.lignes[index];
    // @ts-ignore
    this.lignes.push({ ...s, id: Date.now(), source: [...s.source], cible: [...s.cible] });
  }
}