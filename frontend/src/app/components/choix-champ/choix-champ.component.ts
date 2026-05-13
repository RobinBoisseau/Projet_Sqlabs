import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-choix-champ',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './choix-champ.component.html',
  styleUrls: ['./choix-champ.component.css']
})
export class ChoixChampComponent {
  @Input() champsSelectionnes: string[] = [];
  @Input() champsDisponibles: string[] = [];
  @Input() placeholder: string = 'Ajouter un champ...';

  @Output() selectionChanged = new EventEmitter<string[]>();

  searchText: string = '';
  showDropdown: boolean = false;

  filteredNames(): string[] {
    if (!this.champsDisponibles) return [];
    if (!this.searchText) return this.champsDisponibles;
    return this.champsDisponibles.filter(nom =>
      nom.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  selectName(nom: string) {
    if (!this.champsSelectionnes.includes(nom)) {
      this.champsSelectionnes = [...this.champsSelectionnes, nom];
      this.selectionChanged.emit(this.champsSelectionnes);
    }
    this.searchText = '';
    this.showDropdown = false;
  }

  removeAttribute(index: number) {
    this.champsSelectionnes = this.champsSelectionnes.filter((_, i) => i !== index);
    this.selectionChanged.emit(this.champsSelectionnes);
  }

  hideDropdownAfterDelay() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }
}