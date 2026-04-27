import { Component, OnInit } from '@angular/core';
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-exercice-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './exercice-list.component.html',
  styleUrls: ['./exercice-list.component.css']
})
export class ExerciceListComponent implements OnInit {
  sqlExercises: Exercice[] = [];
  bpmnExercises: Exercice[] = [];

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.exerciceService.getExercices().subscribe(data => {
      console.log('Données brutes reçues :', data); 
      // On sépare les exos selon leur type
      this.sqlExercises = data.filter(e => e.type === 'SQL');
      this.bpmnExercises = data.filter(e => e.type === 'BPMN');
    });
  }
}