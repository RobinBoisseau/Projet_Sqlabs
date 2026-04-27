import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tool-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="tool-item" (click)="onClick()">
      <span class="tool-icon">{{ icon }}</span>
      <span class="tool-label">{{ label }}</span>
    </button>
  `,
  styleUrls: ['./toll-button.component.css']
})
export class ToolButtonComponent {
  @Input() icon: string = '';   // Exemple : '⬜'
  @Input() label: string = '';  // Exemple : 'Entité'
  @Output() toolClick = new EventEmitter<void>();

  onClick() {
    this.toolClick.emit();
  }
}