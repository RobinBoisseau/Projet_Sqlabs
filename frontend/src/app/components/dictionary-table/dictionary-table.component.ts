import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Field } from '../../models/field';
import { DictionaryService } from '../../services/dictionary.service';

@Component({
  selector: 'app-dictionary-table',
  standalone: true,
  imports: [CommonModule, FormsModule], // Ajoute tes autres imports ici
  templateUrl: './dictionary-table.component.html',
  styleUrls: ['./dictionary-table.component.css']
})
export class DictionaryTableComponent implements OnInit {
  lines: Field[] = [];

  constructor(private dictService: DictionaryService) {}

  ngOnInit() {
    // 1. On charge l'historique au démarrage
    const backup = this.dictService.load();
    if (backup.length > 0) {
      this.lines = backup;
    } else {
      this.remplirSiVide();
    }
  }

  // Dès qu'une modif est faite dans le HTML via (ngModelChange)
  onDataChange() {
    this.dictService.save(this.lines);
  }

  ajouterLigne() {
    const nouvelleLigne = new Field(Date.now().toString(), "", "", "");
    this.lines = [...this.lines, nouvelleLigne]; // Immuabilité : on recrée le tableau
    this.onDataChange();
  }

  supprimerLigne(index: number) {
    this.lines = this.lines.filter((_, i) => i !== index);
    this.onDataChange();
    this.remplirSiVide();
  }

  private remplirSiVide() {
    if (this.lines.length === 0) {
      for (let i = 1; i <= 5; i++) {
        this.lines.push(new Field(Date.now().toString() + i, "", "", ""));
      }
    }
  }
}