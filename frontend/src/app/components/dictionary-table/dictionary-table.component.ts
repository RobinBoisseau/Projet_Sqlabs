import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DictionaryLine } from '../../models/dictionary-line.model';
import { AddButtonComponent } from '../add-button/add-button.component'; // Ton composant bouton

@Component({
  selector: 'app-dictionary-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AddButtonComponent], // Ajouté ici
  templateUrl: './dictionary-table.component.html',
  styleUrls: ['./dictionary-table.component.css']
})
export class DictionaryTableComponent implements OnInit {
  private _lines: DictionaryLine[] = [];
  @Input() set lines(val: DictionaryLine[]) { this._lines = val; this.remplirSiVide(); }
  get lines() { return this._lines; }

  @Output() onNomSupprime = new EventEmitter<string>();
  @Output() nomsChanged = new EventEmitter<string[]>();

  ngOnInit() { this.remplirSiVide(); }

  private remplirSiVide() {
    if (this._lines && this._lines.length === 0) {
      for (let i = 1; i <= 5; i++) {
        this._lines.push(new DictionaryLine(Date.now().toString()+i, "", "", ""));
      }
    }
  }

  emitNoms() {
    const noms = this._lines.map(l => l.TechnicalName).filter(n => n && n.trim() !== "");
    this.nomsChanged.emit(noms);
  }

  ajouterLigne() { this._lines.push(new DictionaryLine(Date.now().toString(), "", "", "")); this.emitNoms(); }
  
  supprimerLigne(index: number) {
    const nom = this._lines[index].TechnicalName;
    this._lines.splice(index, 1);
    if (nom) this.onNomSupprime.emit(nom);
    this.emitNoms();
    this.remplirSiVide();
  }

  dupliquerLigne(index: number) {
    const s = this._lines[index];
    this._lines.push(new DictionaryLine(Date.now().toString(), s.name, s.TechnicalName, s.Type));
    this.emitNoms();
  }
}