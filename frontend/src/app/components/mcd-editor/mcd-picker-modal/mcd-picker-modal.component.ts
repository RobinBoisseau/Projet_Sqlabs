import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoixChampComponent } from '../../choix-champ/choix-champ.component';

@Component({
  selector: 'app-mcd-picker-modal',
  standalone: true,
  imports: [CommonModule, ChoixChampComponent],
  templateUrl: './mcd-picker-modal.component.html',
  styleUrls: ['./mcd-picker-modal.component.css'],
})
export class McdPickerModalComponent {
  @Input() isVisible = false;
  @Input() availableNames: string[] = [];
  @Input() currentNames: string[] = [];
  @Input() nodeName = '';

  @Output() selectionChanged = new EventEmitter<string[]>();
  @Output() closed = new EventEmitter<void>();

  onClose(): void { this.closed.emit(); }
  onSelectionChanged(names: string[]): void { this.selectionChanged.emit(names); }
}
