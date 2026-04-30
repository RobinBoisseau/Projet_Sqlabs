import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { ExerciceCardComponent } from '../exercice-card/exercice-card.component';

@Component({
  selector: 'app-exercice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ExerciceCardComponent],
  templateUrl: './exercice-list.component.html',
  styleUrls: ['./exercice-list.component.css']
})
export class ExerciceListComponent implements OnInit {
  // Correction de l'orthographe pour matcher ton HTML (avec un 's')
  sqlExercises: Exercice[] = [];
  bpmnExercises: Exercice[] = [];

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.exerciceService.getExercices().subscribe({
      next: (response: any) => {
        // On récupère le tableau dans response.data (format Laravel)
        const allExercices = response.data ? response.data : response;

        if (Array.isArray(allExercices)) {
          // On filtre en utilisant les noms de variables avec un 's'
          this.sqlExercises = allExercices.filter((ex: any) => ex.type === 'SQL');
          this.bpmnExercises = allExercices.filter((ex: any) => ex.type === 'BPMN');
          
          console.log("Exercices SQL chargés :", this.sqlExercises.length);
        }
      },
      error: (err) => {
        console.error("Erreur lors de la récupération des exercices", err);
      }
    });
  }
}