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
 lignes: DependenceLine[] = [new DependenceLine("1", [], [])];


 onDrop(event: CdkDragDrop<string[]>, list: string[]) {
   const data = event.item.data;
   if (data && !list.includes(data)) list.push(data);
 }


 nettoyerChampSupprime(nomTechnique: string) {
   this.lignes.forEach(l => {
     l.source = l.source.filter(a => a !== nomTechnique);
     l.cible = l.cible.filter(a => a !== nomTechnique);
   });
 }


 removeAtribut(list: string[], index: number) { list.splice(index, 1); }
 ajouterDependance() { this.lignes.push(new DependenceLine(Date.now().toString(), [], [])); }
 supprimerLigne(index: number) { this.lignes.splice(index, 1); }
 dupliquerLigne(index: number) {
   const s = this.lignes[index];
   this.lignes.push(new DependenceLine(Date.now().toString(), [...s.source], [...s.cible]));
 }
}
