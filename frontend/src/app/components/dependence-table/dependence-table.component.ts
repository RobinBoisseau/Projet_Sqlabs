import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DependenceLine } from '../../models/dependence-line.model';
import { AddButtonComponent } from '../add-button/add-button.component';


@Component({
  selector: 'app-dependence-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AddButtonComponent],
  templateUrl: './dependence-table.component.html',
  styleUrls: ['./dependence-table.component.css']
})
export class DependenceTableComponent implements OnInit {
  private _lignes: DependenceLine[] = [];

  @Output() onDependenceChange = new EventEmitter<void>();

  @Input() set lignes(value: DependenceLine[]) {
    if (value && value.length > 0) this._lignes = value;
    else this.remplirSiVide();
  }
  get lignes(): DependenceLine[] { return this._lignes; }

  @Input() nomsTechniques: string[] = [];

  searchSource: { [key: string]: string } = {};
  searchCible: { [key: string]: string } = {};
  showDropdownSource: { [key: string]: boolean } = {};
  showDropdownCible: { [key: string]: boolean } = {};

  ngOnInit() {
    if (this._lignes.length === 0) this.remplirSiVide();
  }

  private notifierChangement() {
    this.onDependenceChange.emit();
  }

  private remplirSiVide() {
    if (this._lignes.length === 0) {
      for (let i = 1; i <= 3; i++) {
        this._lignes.push(new DependenceLine(Date.now().toString() + i, [], []));
      }
    }
  }

  // --- LA MÉTHODE MANQUANTE ---
  hideDropdownAfterDelay(side: 'source' | 'cible', ligneId: string) {
    setTimeout(() => {
      if (side === 'source') {
        this.showDropdownSource[ligneId] = false;
      } else {
        this.showDropdownCible[ligneId] = false;
      }
    }, 200); // Délai de 200ms pour permettre le clic sur l'élément de la liste
  }

  // --- RESTE DES MÉTHODES ---
  selectNom(list: string[], nom: string, ligneId: string, side: 'source' | 'cible') {
    if (!list.includes(nom)) {
      list.push(nom);
      this.notifierChangement(); // <--- ICI
    }
    if (side === 'source') { 
      this.searchSource[ligneId] = ''; 
      this.showDropdownSource[ligneId] = false; 
    } else { 
      this.searchCible[ligneId] = ''; 
      this.showDropdownCible[ligneId] = false; 
    }
  }

  removeAtribut(list: string[], index: number) { 
    list.splice(index, 1); 
    this.notifierChangement(); // <--- ICI
  }

  ajouterDependance() { 
    this._lignes.push(new DependenceLine(Date.now().toString(), [], [])); 
    this.notifierChangement(); // <--- ICI
  }

  supprimerLigne(index: number) { 
    this._lignes.splice(index, 1); 
    this.remplirSiVide(); 
    this.notifierChangement(); // <--- ICI
  }

  dupliquerLigne(index: number) {
    const s = this._lignes[index];
    this._lignes.push(new DependenceLine(Date.now().toString(), [...s.source], [...s.cible]));
    this.notifierChangement(); // <--- ICI
  }

  nettoyerChampSupprime(nom: string) {
    if (!this._lignes) return;
    
    this._lignes.forEach(l => {
      l.source = l.source.filter(a => a !== nom);
      l.cible = l.cible.filter(a => a !== nom);
    });
  }

  filteredNoms(search: string): string[] {
    console.log('Recherche en cours pour:', search, 'parmi:', this.nomsTechniques);
    if (!this.nomsTechniques) return [];
    
    // Si l'utilisateur n'a rien tapé, on montre tout
    if (!search) return this.nomsTechniques;
    
    // Sinon, on filtre (insensible à la casse)
    return this.nomsTechniques.filter(nom => 
      nom.toLowerCase().includes(search.toLowerCase())
    );
  }
}