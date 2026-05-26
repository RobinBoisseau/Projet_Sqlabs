import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolButtonComponent } from '../../toll-button/toll-button.component';

@Component({
  selector: 'app-mcd-toolbar',
  standalone: true,
  imports: [CommonModule, ToolButtonComponent],
  templateUrl: './mcd-toolbar.component.html',
  styleUrls: ['./mcd-toolbar.component.css'],
})
export class McdToolbarComponent {
  @Input() canUndo = false;
  @Input() canRedo = false;

  @Output() dragStart = new EventEmitter<{ event: MouseEvent; type: 'entity' | 'association' }>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();

  onDragStart(event: MouseEvent, type: 'entity' | 'association'): void {
    this.dragStart.emit({ event, type });
  }

  onUndo(): void { this.undo.emit(); }
  onRedo(): void { this.redo.emit(); }
}
