import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSplitModule } from 'angular-split';
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';

@Component({
  selector: 'app-exercice-list',
  standalone: true,
  imports: [CommonModule, AngularSplitModule],
  templateUrl: './exercice-list.component.html',
  styleUrls: ['./exercice-list.component.css']
})
export class ExerciceListComponent implements OnInit {
  exercices: Exercice[] = [];
  
  // On utilise l'index de la liste pour l'accordéon
  selectedIndex: number | null = null; 

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.exerciceService.getExercices().subscribe({
      next: (data) => {
        this.exercices = data;
      },
      error: (err) => console.error('Erreur API Laravel:', err)
    });
  }

  // Ouvre ou ferme l'exercice cliqué
  toggleExercise(index: number): void {
    this.selectedIndex = (this.selectedIndex === index) ? null : index;
  }
}