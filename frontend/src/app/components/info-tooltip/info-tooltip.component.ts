import { Component, Input, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="info-wrapper"
          (mouseenter)="showTooltip()"
          (mouseleave)="isVisible = false">
      <span class="info-star">*</span>
      <span class="info-bubble" *ngIf="isVisible" [ngStyle]="tooltipStyle">{{ text }}</span>
    </span>
  `,
  styles: [`
    .info-wrapper {
      display: inline-flex;
      align-items: center;
      margin-left: 4px;
      cursor: pointer;
    }
    .info-star {
      color: #fff;
      font-weight: bold;
      font-size: 14px;
    }
    .info-bubble {
      position: fixed;
      transform: translate(-50%, -100%);
      background: rgba(30, 41, 59, 0.85); 
      color: #fff;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 9999;
      pointer-events: none;
    }
    .info-bubble::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #1e293b;
    }
  `]
})
export class InfoTooltipComponent {
  @Input() text: string = '';
  isVisible = false;
  tooltipStyle: { [key: string]: string } = {};

  constructor(private el: ElementRef) {}

  showTooltip(): void {
    const rect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
    this.tooltipStyle = {
      top: `${rect.top - 6}px`,
      left: `${rect.left + rect.width / 2}px`,
    };
    this.isVisible = true;
  }
}