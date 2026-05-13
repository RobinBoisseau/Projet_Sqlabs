import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DependenceLine } from '../../models/dependence-line.model';
import { AddButtonComponent } from '../add-button/add-button.component';
import { ChoixChampComponent } from '../choix-champ/choix-champ.component';

@Component({
  selector: 'app-dependence-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AddButtonComponent, ChoixChampComponent],
  templateUrl: './dependence-table.component.html',
  styleUrls: ['./dependence-table.component.css']
})
export class DependenceTableComponent implements OnInit {
  private _lines: DependenceLine[] = [];

  @Input() set lines(value: DependenceLine[]) {
    if (value && value.length > 0) this._lines = value;
    else this.remplirSiVide();
  }
  get lines(): DependenceLine[] { return this._lines; }

  @Input() technicalNames: string[] = [];

  @Output() dependenciesChanged = new EventEmitter<DependenceLine[]>();

  searchSource: { [key: string]: string } = {};
  searchCible: { [key: string]: string } = {};
  showDropdownSource: { [key: string]: boolean } = {};
  showDropdownCible: { [key: string]: boolean } = {};

  ngOnInit() {
    if (this._lines.length === 0) this.remplirSiVide();
  }

  majDep(index: number, side: 'source' | 'cible', newValues: string[]) {
    const dep = this._lines[index];
    if (side === 'source') dep.source = newValues;
    else dep.cible = newValues;
    this.emitChanges();
  }

  emitChanges() {
    this.dependenciesChanged.emit(this._lines);
  }

  private remplirSiVide() {
    if (this._lines.length === 0) {
      for (let i = 1; i <= 3; i++) {
        this._lines.push(new DependenceLine(Date.now().toString() + i, [], []));
      }
    }
  }

  hideDropdownAfterDelay(side: 'source' | 'cible', ligneId: string) {
    setTimeout(() => {
      if (side === 'source') this.showDropdownSource[ligneId] = false;
      else this.showDropdownCible[ligneId] = false;
    }, 200);
  }

  selectName(list: string[], nom: string, ligneId: string, side: 'source' | 'cible') {
  if (!list.includes(nom)) {
    // ✅ Nouvelle référence au lieu de push
    const ligne = this._lines.find(l => l.id === ligneId);
    if (ligne) {
      if (side === 'source') {
        ligne.source = [...ligne.source, nom];
      } else {
        ligne.cible = [...ligne.cible, nom];
      }
      this._lines = [...this._lines]; // ✅ Force la détection de changement
      this.emitChanges();
    }
  }
  if (side === 'source') {
    this.searchSource[ligneId] = '';
    this.showDropdownSource[ligneId] = false;
  } else {
    this.searchCible[ligneId] = '';
    this.showDropdownCible[ligneId] = false;
  }
}

removeAttribute(list: string[], index: number) {
  // ✅ Trouve la ligne qui contient cette liste
  const ligne = this._lines.find(l => l.source === list || l.cible === list);
  if (ligne) {
    if (ligne.source === list) {
      ligne.source = ligne.source.filter((_, i) => i !== index);
    } else {
      ligne.cible = ligne.cible.filter((_, i) => i !== index);
    }
    this._lines = [...this._lines]; // ✅ Force la détection
    this.emitChanges();
  }
}

  ajouterDependance() {
    this._lines.push(new DependenceLine(Date.now().toString(), [], []));
    this.emitChanges();
  }

  supprimerLigne(index: number) {
    // On crée une nouvelle référence de tableau
    this._lines = this._lines.filter((_, i) => i !== index);

    // On maintient le minimum de lignes vides
    this.remplirSiVide();

    // On notifie le parent pour la sauvegarde
    this.emitChanges();
  }

  dupliquerLigne(index: number) {
    const s = this._lines[index];
    // On crée un nouvel objet pour éviter les problèmes de référence mémoire
    const nouvelleLigne = new DependenceLine(Date.now().toString(), [...s.source], [...s.cible]);

    this._lines = [...this._lines, nouvelleLigne];
    this.emitChanges();
  }

  nettoyerChampSupprime(nom: string) {
    if (!this._lines) return;
    this._lines.forEach(l => {
      l.source = l.source.filter(a => a !== nom);
      l.cible = l.cible.filter(a => a !== nom);
    });
    this.emitChanges();
  }

  filteredNames(search: string): string[] {
    if (!this.technicalNames) return [];
    if (!search) return this.technicalNames;
    return this.technicalNames.filter(nom =>
      nom.toLowerCase().includes(search.toLowerCase())
    );
  }
}