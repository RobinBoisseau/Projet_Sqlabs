import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DependenceLine } from '../../models/dependence-line.model';
import { AddButtonComponent } from '../add-button/add-button.component';
import { ChoixChampComponent } from '../choix-champ/choix-champ.component';

@Component({
  selector: 'app-dependence-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AddButtonComponent,ChoixChampComponent],
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
      list.push(nom);
      this.emitChanges();
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
    list.splice(index, 1);
    this.emitChanges();
  }

  ajouterDependance() {
    this._lines.push(new DependenceLine(Date.now().toString(), [], []));
    this.emitChanges();
  }

  supprimerLigne(index: number) {
    this._lines.splice(index, 1);
    this.remplirSiVide();
    this.emitChanges();
  }

  dupliquerLigne(index: number) {
    const s = this._lines[index];
    this._lines.push(new DependenceLine(Date.now().toString(), [...s.source], [...s.cible]));
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