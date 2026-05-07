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
  sqlExercises: Exercice[] = [];
  bpmnExercises: Exercice[] = [];

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.exerciceService.getExercices().subscribe({
      next: (data) => {
        this.sqlExercises = data.filter(ex => ex.type === 'SQL');
        this.bpmnExercises = data.filter(ex => ex.type === 'BPMN');
      },
      error: (err) => console.error("Erreur liste", err)
    });
  }
}