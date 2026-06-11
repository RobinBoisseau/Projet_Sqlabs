import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClasseService } from '../../../services/classe.service';
import { TentativeViewerComponent } from '../tentative-viewer/tentative-viewer.component';

@Component({
  selector: 'app-class-exercice-detail',
  standalone: true,
  imports: [CommonModule, TentativeViewerComponent, RouterModule],
  templateUrl: './class-exercice-detail.component.html',
})
export class ClassExerciceDetailComponent implements OnInit {
  classeId = 0;
  slug = '';
  exercice: any = null;
  students: any[] = [];
  loading = true;
  error = '';

  showViewer = false;
  selectedStudent: { id: number; name: string } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classeService: ClasseService
  ) { }

  ngOnInit(): void {
    this.classeId = Number(this.route.snapshot.paramMap.get('id'));
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.classeService.getExerciceDetail(this.classeId, this.slug).subscribe({
      next: (data) => {
        this.exercice = data.exercice;
        this.students = data.students;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les données.';
        this.loading = false;
      },
    });
  }
  goBack(): void {
    // On repart vers l'onglet "exercises" de la classe
    // Le chemin dans tes routes est 'classes/:id' -> child 'exercises'
    this.router.navigate(['/classes', this.classeId, 'exercises']);
  }

  openViewer(student: { id: number; name: string }): void {
    this.selectedStudent = student;
    this.showViewer = true;
  }

  closeViewer(): void {
    this.showViewer = false;
    this.selectedStudent = null;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      default: return 'Non commencé';
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-warning';
      default: return 'badge-ghost';
    }
  }

  get countNotStarted(): number {
    return this.students.filter(s => s.status === 'not_started').length;
  }

  get countInProgress(): number {
    return this.students.filter(s => s.status === 'in_progress').length;
  }

  get countCompleted(): number {
    return this.students.filter(s => s.status === 'completed').length;
  }

  openExercice(): void {
    window.open(`/exercice/${this.slug}`, '_blank');
  }
}
