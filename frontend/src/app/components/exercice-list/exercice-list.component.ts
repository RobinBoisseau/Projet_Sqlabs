import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Exercice } from '../../models/exercice';
import { ExerciceService } from '../../services/exercice.service';

@Component({
  selector: 'app-exercice-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exercice-list.component.html',
  styleUrl: './exercice-list.component.css'
})
export class ExerciceListComponent implements OnInit {

  exercices: Exercice[] = [];

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.exerciceService.getExercices().subscribe({
      next: (data) => this.exercices = data,
      error: (err) => console.error('Erreur:', err)
    });
  }
}