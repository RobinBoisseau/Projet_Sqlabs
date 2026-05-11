import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CoursService } from '../../../services/cours.service';

interface CoursStats {
  visibility: boolean;
  exercices_count: number;
  started: number;
  completed: number;
}

@Component({
  selector: 'app-cours-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cours-detail.component.html',
})
export class CoursDetailComponent implements OnInit {
  stats: CoursStats | null = null;
  loading = true;
  error = '';

  constructor(private route: ActivatedRoute, private coursService: CoursService) {}

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.coursService.getStats(id).subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les statistiques.'; this.loading = false; }
    });
  }
}
