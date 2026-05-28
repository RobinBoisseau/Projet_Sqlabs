import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collapse-panel-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collapse-panel-button.component.html',
  styleUrls: ['./collapse-panel-button.component.css']
})
export class CollapsePanelButtonComponent {
  @Input() direction: 'left' | 'right' | 'up' | 'down' = 'left';
  @Input() collapsed: boolean = false;
  @Output() toggle = new EventEmitter<void>();

  get rotation(): number {
    const map: Record<string, [number, number]> = {
      left:  [180, 0],
      right: [0, 180],
      up:    [270, 90],
      down:  [90, 270],
    };
    const [normal, flipped] = map[this.direction];
    return this.collapsed ? flipped : normal;
  }
}
