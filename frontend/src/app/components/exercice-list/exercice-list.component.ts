import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ExerciceService } from '../../services/exercice.service';
import { CoursService } from '../../services/cours.service';
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

  coursId = 0;
  coursNom = '';
  courseExercises: Exercice[] = [];

  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService,
    private coursService: CoursService,
  ) {}

  ngOnInit(): void {
    const coursId = Number(this.route.snapshot.paramMap.get('id'));

    if (coursId) {
      forkJoin({
        cours: this.coursService.getCour(coursId),
        exercices: this.exerciceService.getExercices(),
      }).subscribe({
        next: ({ cours, exercices }) => {
          this.coursId = coursId;
          this.coursNom = cours.nom;
          const orderMap = new Map((cours.exercices ?? []).map(e => [e.id, e.order]));
          this.courseExercises = exercices
            .filter(e => orderMap.has(e.id))
            .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
          this.loading = false;
        },
        error: () => { this.error = 'Impossible de charger le cours.'; this.loading = false; },
      });
    } else {
      this.exerciceService.getExercices().subscribe({
        next: (data) => {
          this.sqlExercises = data.filter(ex => ex.type === 'SQL');
          this.bpmnExercises = data.filter(ex => ex.type === 'BPMN');
          this.loading = false;
        },
        error: () => { this.error = 'Impossible de charger les exercices.'; this.loading = false; },
      });
    }
  }
}
