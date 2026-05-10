import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CoursService } from '../../../services/cours.service';
import { Cours } from '../../../models/cours';

@Component({
  selector: 'app-cours-delete',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cours-delete.component.html',
})
export class CoursDeleteComponent implements OnInit {
  cours: Cours | null = null;
  loading = true;
  deleting = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursService: CoursService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.coursService.getCour(id).subscribe({
      next: c => { this.cours = c; this.loading = false; },
      error: () => { this.error = 'Cours introuvable.'; this.loading = false; }
    });
  }

  confirm(): void {
    if (!this.cours || this.deleting) return;
    this.deleting = true;
    this.coursService.deleteCours(this.cours.id).subscribe({
      next: () => this.router.navigate(['/admin/cours']),
      error: () => { this.error = 'Une erreur est survenue.'; this.deleting = false; }
    });
  }
}
