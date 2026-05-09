import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-class-progress-individual',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto py-10 px-6">
      <h1 class="text-2xl font-bold text-gray-800">Suivre la progression de chaque membre</h1>
    </div>
  `,
})
export class ClassProgressIndividualComponent {}
