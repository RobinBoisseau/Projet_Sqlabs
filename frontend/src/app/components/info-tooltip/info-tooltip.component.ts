import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="tooltip-wrapper">
      <span class="tooltip-icon">ℹ</span>
      <span class="tooltip-box">{{ text }}</span>
    </span>
  `,
  styles: [`
    .tooltip-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 5px;
      cursor: help;
    }
    .tooltip-icon {
      font-size: 12px;
      color: #94a3b8;
      border: 1px solid #94a3b8;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .tooltip-box {
      visibility: hidden;
      opacity: 0;
      background: #1e293b;
      color: #f8fafc;
      font-size: 11px;
      font-weight: normal;
      text-align: left;
      border-radius: 6px;
      padding: 6px 10px;
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      white-space: normal;
      width: 220px;
      z-index: 1000;
      transition: opacity 0.15s;
      pointer-events: none;
    }
    .tooltip-wrapper:hover .tooltip-box {
      visibility: visible;
      opacity: 1;
    }
  `]
})
export class InfoTooltipComponent {
  @Input() text: string = '';
}
