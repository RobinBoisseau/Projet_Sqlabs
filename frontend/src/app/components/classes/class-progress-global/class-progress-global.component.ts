import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ClasseService } from '../../../services/classe.service';

@Component({
  selector: 'app-class-progress-global',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './class-progress-global.component.html',
})
export class ClassProgressGlobalComponent implements OnInit {
  classeId = 0;
  cours: any[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private classeService: ClasseService,
  ) {}

  ngOnInit(): void {
    this.classeId = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.classeService.getClasseCours(this.classeId).subscribe({
      next: (data) => {
        this.cours = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  total(stats: any): number {
    return stats.not_started + stats.in_progress + stats.completed;
  }

  pct(count: number, stats: any): number {
    const t = this.total(stats);
    return t === 0 ? 0 : Math.round((count / t) * 100);
  }
}
