import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="btn-add" (click)="onClick()">
      {{ label }}
    </button>
  `,
  styleUrls: ['./add-button.component.css']
})
export class AddButtonComponent {
  @Input() label: string = ''; // Le texte du bouton
  @Output() btnClick = new EventEmitter<void>(); // L'événement de clic

  onClick() {
    this.btnClick.emit(); // On prévient le parent
  }
}