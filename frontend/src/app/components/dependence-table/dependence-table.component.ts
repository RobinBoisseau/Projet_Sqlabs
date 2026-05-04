import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DependenceLine } from '../../models/dependence-line.model';

@Component({
  selector: 'app-dependence-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dependence-table.component.html',
  styleUrls: ['./dependence-table.component.css']
})
export class DependenceTableComponent {
  @Input() lignes: DependenceLine[] = [];
  @Input() nomsTechniques: string[] = [];

  // Recherche pour chaque ligne (source et cible)
  searchSource: { [key: string]: string } = {};
  searchCible: { [key: string]: string } = {};
  showDropdownSource: { [key: string]: boolean } = {};
  showDropdownCible: { [key: string]: boolean } = {};

  filteredNoms(search: string): string[] {
    if (!search) return this.nomsTechniques;
    return this.nomsTechniques.filter(n =>
      n.toLowerCase().includes(search.toLowerCase())
    );
  }

  // --- LA FONCTION QUI MANQUAIT ---
  // On attend 200ms avant de fermer pour laisser le temps au clic (mousedown) d'être pris en compte
  hideDropdownAfterDelay(side: 'source' | 'cible', ligneId: string) {
    setTimeout(() => {
      if (side === 'source') {
        this.showDropdownSource[ligneId] = false;
      } else {
        this.showDropdownCible[ligneId] = false;
      }
    }, 200);
  }

  selectNom(list: string[], nom: string, ligneId: string, side: 'source' | 'cible') {
    if (!list.includes(nom)) {
      list.push(nom);
    }
    // On réinitialise après la sélection
    if (side === 'source') {
      this.searchSource[ligneId] = '';
      this.showDropdownSource[ligneId] = false;
    } else {
      this.searchCible[ligneId] = '';
      this.showDropdownCible[ligneId] = false;
    }
  }

  nettoyerChampSupprime(nomTechnique: string) {
    this.lignes.forEach(l => {
      l.source = l.source.filter(a => a !== nomTechnique);
      l.cible = l.cible.filter(a => a !== nomTechnique);
    });
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
    const s = this.lignes[index];
    this.lignes.push(new DependenceLine(
      Date.now().toString(), 
      [...s.source], 
      [...s.cible]
    ));
  }
}