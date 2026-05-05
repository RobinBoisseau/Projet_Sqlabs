import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Field } from '../../models/field';
import { DictionaryService } from '../../services/dictionary.service';
import { AddButtonComponent } from '../add-button/add-button.component';

@Component({
  selector: 'app-dictionary-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AddButtonComponent], 
  templateUrl: './dictionary-table.component.html',
  styleUrls: ['./dictionary-table.component.css']
})
export class DictionaryTableComponent implements OnInit {
  // @Input permet de recevoir "mcd.Entities" du parent
  @Input() lines: Field[] = []; 
  @Output() onFieldChange = new EventEmitter<void>();
  @Output() onNomSupprime = new EventEmitter<string>();
  @Output() nomsChanged = new EventEmitter<string[]>();

  constructor(private dictService: DictionaryService) {}

  ngOnInit() {
    if (!this.lines || this.lines.length === 0) {
      const backup = this.dictService.load();
      this.lines = backup.length > 0 ? backup : this.genererLignesVides();
      
      // CRUCIAL : On émet un signal immédiatement pour que le 
      // parent récupère ces lignes dans son propre tableau 'allFields'
      setTimeout(() => {
        this.onFieldChange.emit();
      });
    }
  }

  // Cette fonction est appelée à chaque lettre tapée
 onDataChange() {
    this.dictService.save(this.lines);
    this.onFieldChange.emit(); 

    const noms = this.lines.map(l => l.TechnicalName).filter(n => !!n);
    this.nomsChanged.emit(noms);
  }

  onInputChange() {
    this.onFieldChange.emit();
  }

  ajouterLigne() {
    const nouvelleLigne = new Field(Date.now().toString(), "", "", "");
    this.lines.push(nouvelleLigne); // On ajoute à la liste existante
    this.onDataChange();
  }

  supprimerLigne(index: number) {
    const nom = this.lines[index].TechnicalName;
    this.lines.splice(index, 1);
    if (nom) this.onNomSupprime.emit(nom);
    this.onDataChange();
  }

  dupliquerLigne(index: number) {
    const s = this.lines[index];
    const copie = new Field(
      Date.now().toString(), 
      s.name, 
      s.TechnicalName, 
      s.Type
    );
    this.lines.push(copie);
    this.onDataChange();
  }
  
  trackByFn(index: number, item: any) {
    return item.id; // Ou index si tes objets n'ont pas d'ID stable
  }

  private genererLignesVides(): Field[] {
    const defaultLines = [];
    for (let i = 1; i <= 5; i++) {
      defaultLines.push(new Field(Date.now().toString() + i, "", "", ""));
    }
    return defaultLines;
  }

}