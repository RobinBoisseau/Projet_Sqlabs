import { Component } from '@angular/core';
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
  lignes: DictionaryLine[] = [
    new DictionaryLine("1", "", "", ""),
    new DictionaryLine("2", "", "", ""),
    new DictionaryLine("3", "", "", ""),
    new DictionaryLine("4", "", "", "")
  ];

  ajouterLigne() {
    const id = (this.lignes.length + 1).toString();
    this.lignes.push(new DictionaryLine(id, "", "", ""));
  }

  supprimerLigne(index: number) {
    this.lignes.splice(index, 1);
  }

  dupliquerLigne(index: number) {
    const s = this.lignes[index];
    this.lignes.push(new DictionaryLine(Date.now().toString(), s.NomMetier, s.NomTechnique, s.Type));
  }
}