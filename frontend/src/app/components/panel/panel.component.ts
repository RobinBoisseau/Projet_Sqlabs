import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollapsePanelButtonComponent } from '../collapse-panel-button/collapse-panel-button.component';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, CollapsePanelButtonComponent],
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.css']
})
export class PanelComponent {
  @Input() title: string = '';
  @Input() scrollable: boolean = true;
  @Input() collapsible: boolean = false;
  @Input() collapsed: boolean = false;
  @Input() collapseDirection: 'left' | 'right' | 'up' | 'down' = 'left';
  @Input() hasIaError = false;
  @Input() globalIaQuestion: string = '';
  @Output() toggleCollapse = new EventEmitter<void>();
}