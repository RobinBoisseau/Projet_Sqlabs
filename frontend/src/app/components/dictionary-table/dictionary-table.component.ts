import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Field } from '../../models/field';
import { AddButtonComponent } from '../add-button/add-button.component';
import { InfoTooltipComponent } from '../info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-dictionary-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AddButtonComponent, InfoTooltipComponent],
  templateUrl: './dictionary-table.component.html',
  styleUrls: ['./dictionary-table.component.css']
})
export class DictionaryTableComponent implements OnChanges {

  @Input() lines: Field[] = [];
  @Input() iaRemarks: Map<string, string> = new Map();
  @Input() readonly = false;
  @Output() technicalNamesChanged = new EventEmitter<string[]>();
  @Output() dictionaryChanged = new EventEmitter<Field[]>();

  @ViewChildren('tableRow') tableRows!: QueryList<ElementRef>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['lines']) {
      // Si lines est vide ou non défini, on génère des lignes vides
      if (!this.lines || this.lines.length === 0) {
        this.lines = this.generateEmptyLines();
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
    setTimeout(() => {
      const rows = this.tableRows.toArray();
      if (rows.length > 0) {
        rows[rows.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  }

  removeLine(index: number) {
    console.log("BOUTON SUPPRIMER CLIQUÉ ! Index:", index);
    this.lines = this.lines.filter((_, i) => i !== index);
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