import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Exercice } from '../../models/exercice';

@Component({
  selector: 'app-exercice-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './exercice-card.component.html',
  styleUrls: ['./exercice-card.component.css']
})
export class ExerciceCardComponent {
  @Input() exo!: Exercice;
  @Input() index!: number;
}