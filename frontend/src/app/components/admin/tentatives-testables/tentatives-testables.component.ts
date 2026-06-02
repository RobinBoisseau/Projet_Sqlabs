import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ExerciceService } from '../../../services/exercice.service';

interface TestableTentative {
  id: number;
  exercise_id: number;
  user: { id: number; name: string } | null;
  date: string | null;
  dictionnaireValide: boolean | null;
  dependanceValide: boolean | null;
  modeleValide: boolean | null;
}

@Component({
  selector: 'app-tentatives-testables',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './tentatives-testables.component.html',
})
export class TentativesTestablesComponent implements OnInit {
  slug = '';
  exerciceTitle = '';
  tentatives: TestableTentative[] = [];
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService,
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.exerciceService.getTestableTentatives(this.slug).subscribe({
      next: (res: any) => {
        this.exerciceTitle = res.exercice?.title ?? '';
        this.tentatives = res.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les tentatives testables.';
        this.isLoading = false;
      },
    });
  }

  statut(t: TestableTentative): { label: string; css: string } {
    const all = t.dictionnaireValide && t.dependanceValide && t.modeleValide;
    const some = t.dictionnaireValide || t.dependanceValide || t.modeleValide;
    if (all)  return { label: 'Valide',     css: 'bg-green-100 text-green-700' };
    if (some) return { label: 'Partiel',    css: 'bg-yellow-100 text-yellow-700' };
    return       { label: 'Non valide',   css: 'bg-red-100 text-red-700' };
  }
}
