import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Field } from '../../models/field';
import { AddButtonComponent } from '../add-button/add-button.component';

@Component({
  selector: 'app-dictionary-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AddButtonComponent],
  templateUrl: './dictionary-table.component.html',
  styleUrls: ['./dictionary-table.component.css']
})
export class DictionaryTableComponent implements OnChanges {

  @Input() lines: Field[] = [];
  @Output() technicalNamesChanged = new EventEmitter<string[]>();
  @Output() dictionaryChanged = new EventEmitter<Field[]>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['lines']) {
      // Si lines est vide ou non défini, on génère des lignes vides
      if (!this.lines || this.lines.length === 0) {
        this.lines = this.generateEmptyLines();
        setTimeout(() => this.emitChanges());
      }
      // Si lines est rempli (chargement depuis la BD), on met à jour les noms techniques
      else {
        setTimeout(() => this.emitChanges());
      }
    }
  }

  emitChanges() {
    const names = this.lines
      .map(l => l.TechnicalName)
      .filter(n => n && n.trim() !== '');
    this.technicalNamesChanged.emit(names);
    this.dictionaryChanged.emit(this.lines);
  }

  addLine() {
    this.lines.push(new Field(Date.now().toString(), '', '', ''));
    this.emitChanges();
  }

  removeLine(index: number) {
    this.lines.splice(index, 1);
    this.emitChanges();
  }

  duplicateLine(index: number) {
    const s = this.lines[index];
    this.lines.push(new Field(Date.now().toString(), s.name, s.TechnicalName, s.Type));
    this.emitChanges();
  }

  trackByFn(index: number, item: any) {
    return item.id;
  }

  private generateEmptyLines(): Field[] {
    const lines = [];
    for (let i = 1; i <= 5; i++) {
      lines.push(new Field(Date.now().toString() + i, '', '', ''));
    }
    return lines;
  }
}