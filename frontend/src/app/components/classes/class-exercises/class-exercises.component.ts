import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ClasseService } from '../../../services/classe.service';

@Component({
  selector: 'app-class-exercises',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './class-exercises.component.html',
})
export class ClassExercisesComponent implements OnInit {
  classeId = 0;
  cours: any[] = [];
  selectedCours: any = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private classeService: ClasseService,
  ) {}

  ngOnInit(): void {
    this.classeId = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.classeService.getClasseCours(this.classeId).subscribe({
      next: (data) => {
        this.cours = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les cours.';
        this.loading = false;
      },
    });
  }

  selectCours(c: any): void {
    this.selectedCours = c;
  }

  backToList(): void {
    this.selectedCours = null;
  }

  openDetail(slug: string): void {
    window.open(`/classes/${this.classeId}/exercises/${slug}/details`, '_blank');
  }
}
