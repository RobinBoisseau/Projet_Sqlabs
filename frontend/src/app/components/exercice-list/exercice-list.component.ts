import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';

@Component({
  selector: 'app-exercice-list',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './exercice-list.component.html',
  styleUrls: ['./exercice-list.component.css']
})
export class ExerciceListComponent implements OnInit {
  sqlExercises: Exercice[] = [];
  bpmnExercises: Exercice[] = [];

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.exerciceService.getExercices().subscribe({
      next: (response: any) => {
        const allExercices = response.data ? response.data : response;
        if (Array.isArray(allExercices)) {
          this.sqlExercises = allExercices.filter((ex: any) => ex.type === 'SQL');
          this.bpmnExercises = allExercices.filter((ex: any) => ex.type === 'BPMN');
        }
      },
      error: (err) => console.error(err)
    });
  }
}