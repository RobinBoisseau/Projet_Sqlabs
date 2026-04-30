import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Entities } from '../../models/entities';

@Component({
  selector: 'app-dictionary-table',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './dictionary-table.component.html',
  styleUrls: ['./dictionary-table.component.css']
})
export class DictionaryTableComponent {
  // On utilise ton modèle Entities
  @Input() lignes: Entities[] = []; 
  @Output() onNomSupprime = new EventEmitter<string>();

  ajouterLigne() {
    const id = Date.now();
    // On crée une nouvelle entité avec tes paramètres : id, name, largeur, hauteur, x, y, fields
    this.lignes.push(new Entities(id, "", 140, 100, 50, 50, []));
  }

  supprimerLigne(index: number) {
    const nom = this.lignes[index].name;
    this.lignes.splice(index, 1);
    if (nom) {
      this.onNomSupprime.emit(nom);
    }
  }

  dupliquerLigne(index: number) {
    const s = this.lignes[index];
    const id = Date.now();
    this.lignes.push(new Entities(id, s.name, s.largeur, s.hauteur, s.x + 20, s.y + 20, [...s.fields]));
  }
}