import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-page.component.html',
  styleUrls: ['./success-page.component.css']
})
export class SuccessPageComponent {
  @Input() nextSlug: string | null = null;
  @Output() closed = new EventEmitter<void>();

  constructor(private router: Router) {}

  goToList(): void {
    this.router.navigate(['/exercices']);
  }

  goToNext(): void {
    if (this.nextSlug) {
      this.router.navigate(['/exercice', this.nextSlug]);
    }
  }
}
