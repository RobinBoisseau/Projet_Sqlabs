import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ClasseService, Member } from '../../../services/classe.service';

@Component({
  selector: 'app-class-progress-individual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-progress-individual.component.html',
})
export class ClassProgressIndividualComponent implements OnInit {
  classeId = 0;
  members: Member[] = [];
  filtered: Member[] = [];
  search = '';
  loading = true;
  error = '';

  selected: any = null;
  progressLoading = false;
  progressError = '';

  constructor(
    private route: ActivatedRoute,
    private classeService: ClasseService,
  ) {}

  ngOnInit(): void {
    this.classeId = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.classeService.getMembers(this.classeId).subscribe({
      next: (data) => {
        this.members = data.filter(m => m.pivot_role === 'student');
        this.filtered = [...this.members];
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les membres.';
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    const q = this.search.toLowerCase().trim();
    this.filtered = q
      ? this.members.filter(m =>
          m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      : [...this.members];
  }

  openStudent(member: Member): void {
    this.selected = null;
    this.progressError = '';
    this.progressLoading = true;
    this.classeService.getStudentProgress(this.classeId, member.id).subscribe({
      next: (data) => {
        this.selected = data;
        this.progressLoading = false;
      },
      error: () => {
        this.progressError = 'Impossible de charger la progression.';
        this.progressLoading = false;
      },
    });
  }

  back(): void {
    this.selected = null;
    this.progressError = '';
  }

  statusLabel(s: string): string {
    if (s === 'completed') return 'Terminé';
    if (s === 'in_progress') return 'En cours';
    return 'À faire';
  }

  statusClass(s: string): string {
    if (s === 'completed') return 'badge-success';
    if (s === 'in_progress') return 'badge-warning';
    return 'badge-ghost';
  }

  completionPct(stats: any): number {
    if (!stats?.total) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  }
}
