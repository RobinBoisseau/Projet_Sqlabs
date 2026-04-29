import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DictionaryLine } from '../../models/dictionary-line.model';

@Component({
  selector: 'app-dictionary-table',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './dictionary-table.component.html',
  styleUrls: ['./dictionary-table.component.css']
})
export class DictionaryTableComponent {
  @Output() onNomSupprime = new EventEmitter<string>();

  lignes: DictionaryLine[] = [
    new DictionaryLine("1", "", "", "VARCHAR2"),
    new DictionaryLine("2", "", "", "VARCHAR2"),
  ];

  ajouterLigne() {
    this.lignes.push(new DictionaryLine(Date.now().toString(), "", "", "VARCHAR2"));
  }

  supprimerLigne(index: number) {
    const nom = this.lignes[index].NomTechnique;
    this.lignes.splice(index, 1);
    if (nom) this.onNomSupprime.emit(nom);
  }

  dupliquerLigne(index: number) {
    const s = this.lignes[index];
    this.lignes.push(new DictionaryLine(Date.now().toString(), s.NomMetier, s.NomTechnique, s.Type));
  }
}