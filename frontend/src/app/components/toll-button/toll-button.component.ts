import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toll-button', // Doit matcher la balise dans ton HTML
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="tool-item" (click)="onClick()">
      <span class="tool-icon">{{ icon }}</span>
      <span class="tool-label">{{ label }}</span>
    </button>
  `,
  styles: [`
    .tool-item {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 0.8rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
    }
    .tool-item:hover {
        border-color: #1a73e8;
        background: #f0f7ff;
        color: #1a73e8;
    }
  `]
})
export class ToolButtonComponent { // Ta classe s'appelle ToolButton
  @Input() icon: string = '';
  @Input() label: string = '';
  @Output() toolClick = new EventEmitter<void>();

  onClick() {
    this.toolClick.emit();
  }
}