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
 // Permet de prévenir le tableau des dépendances qu'une ligne est supprimée
 @Output() onNomSupprime = new EventEmitter<string>();


 // Initialisation avec le type vide ""
 lignes: DictionaryLine[] = [
   new DictionaryLine("1", "", "", ""),
   new DictionaryLine("2", "", "", ""),
   new DictionaryLine("3", "", "", ""),
   new DictionaryLine("4", "", "", ""),
   new DictionaryLine("5", "", "", ""),
 ];


 ajouterLigne() {
   const id = Date.now().toString();
   // Nouvelle ligne avec type vide par défaut
   this.lignes.push(new DictionaryLine(id, "", "", ""));
 }


 supprimerLigne(index: number) {
   const nomASupprimer = this.lignes[index].NomTechnique;
   this.lignes.splice(index, 1);
  
   // Si le nom technique existait, on demande aux dépendances de nettoyer
   if (nomASupprimer) {
     this.onNomSupprime.emit(nomASupprimer);
   }
 }


 dupliquerLigne(index: number) {
   const s = this.lignes[index];
   this.lignes.push(new DictionaryLine(Date.now().toString(), s.NomMetier, s.NomTechnique, s.Type));
 }
}
