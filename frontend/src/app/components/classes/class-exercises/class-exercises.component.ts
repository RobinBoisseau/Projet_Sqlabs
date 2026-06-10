import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { filter, take } from 'rxjs';
import { ClasseService } from '../../../services/classe.service';
import { AuthService } from '../../../services/auth.service';

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
  isTeacher = false;

  constructor(
    private route: ActivatedRoute,
    private classeService: ClasseService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.isTeacher = user.role === 'professeur' || user.role === 'admin';
    } else {
      this.authService.currentUser$.pipe(filter(u => u !== null), take(1)).subscribe(u => {
        this.isTeacher = u?.role === 'professeur' || u?.role === 'admin';
      });
    }

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
