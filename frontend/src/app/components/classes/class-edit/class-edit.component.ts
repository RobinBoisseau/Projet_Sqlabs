import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-class-edit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto py-10 px-6">
      <h1 class="text-2xl font-bold text-gray-800">Modifier la classe</h1>
    </div>
  `,
})
export class ClassEditComponent {}
