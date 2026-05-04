import { Component, Input, OnInit } from '@angular/core';
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
export class DependenceTableComponent implements OnInit {
  private _lignes: DependenceLine[] = [];

  // Le SETTER pour les dépendances
  @Input() set lignes(value: DependenceLine[]) {
    this._lignes = value;
    this.remplirSiVide();
  }

  get lignes(): DependenceLine[] {
    return this._lignes;
  }

  @Input() nomsTechniques: string[] = [];

  searchSource: { [key: string]: string } = {};
  searchCible: { [key: string]: string } = {};
  showDropdownSource: { [key: string]: boolean } = {};
  showDropdownCible: { [key: string]: boolean } = {};

  ngOnInit() {
    this.remplirSiVide();
  }

  private remplirSiVide() {
    // Si le tableau est vide (nouvel exercice), on force 3 lignes
    if (this._lignes && this._lignes.length === 0) {
      for (let i = 1; i <= 3; i++) {
        this._lignes.push(new DependenceLine(Date.now().toString() + i, [], []));
      }
    }
  }

  filteredNoms(search: string): string[] {
    if (!search) return this.nomsTechniques;
    return this.nomsTechniques.filter(n =>
      n.toLowerCase().includes(search.toLowerCase())
    );
  }

  hideDropdownAfterDelay(side: 'source' | 'cible', ligneId: string) {
    setTimeout(() => {
      if (side === 'source') this.showDropdownSource[ligneId] = false;
      else this.showDropdownCible[ligneId] = false;
    }, 200);
  }

  selectNom(list: string[], nom: string, ligneId: string, side: 'source' | 'cible') {
    if (!list.includes(nom)) list.push(nom);
    if (side === 'source') {
      this.searchSource[ligneId] = '';
      this.showDropdownSource[ligneId] = false;
    } else {
      this.searchCible[ligneId] = '';
      this.showDropdownCible[ligneId] = false;
    }
  }

  nettoyerChampSupprime(nomTechnique: string) {
    this._lignes.forEach(l => {
      l.source = l.source.filter(a => a !== nomTechnique);
      l.cible = l.cible.filter(a => a !== nomTechnique);
    });
  }

  removeAtribut(list: string[], index: number) {
    list.splice(index, 1);
  }

  ajouterDependance() {
    this._lignes.push(new DependenceLine(Date.now().toString(), [], []));
  }

  supprimerLigne(index: number) {
    this._lignes.splice(index, 1);
    this.remplirSiVide();
  }

  dupliquerLigne(index: number) {
    const s = this._lignes[index];
    this._lignes.push(new DependenceLine(Date.now().toString(), [...s.source], [...s.cible]));
  }
}