import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { CoursService } from '../../../services/cours.service';
import { ExerciceService } from '../../../services/exercice.service';

export interface DragItem { id: number; title: string; slug: string; type: string; }

@Component({
  selector: 'app-cours-exercices',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './cours-exercices.component.html',
  styleUrl: './cours-exercices.component.css',
})
export class CoursExercicesComponent implements OnInit {
  coursId = 0;

  courseItems: DragItem[] = [];
  availableItems: DragItem[] = [];

  private allExercices: DragItem[] = [];

  searchQuery = '';
  loading = true;
  saving = false;
  error = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private coursService: CoursService,
    private exerciceService: ExerciceService,
  ) {}

  ngOnInit(): void {
    this.coursId = Number(this.route.parent?.snapshot.paramMap.get('id'));
    forkJoin({
      cours: this.coursService.getCour(this.coursId),
      exercices: this.exerciceService.getExercices(),
    }).subscribe({
      next: ({ cours, exercices }) => {
        this.allExercices = exercices.map(e => ({ id: e.id, title: e.title, slug: e.slug, type: e.type }));
        this.courseItems = (cours.exercices ?? [])
          .sort((a, b) => a.order - b.order)
          .map(e => ({ id: e.id, title: e.title, slug: e.slug, type: e.type }));
        const courseIds = new Set(this.courseItems.map(e => e.id));
        this.availableItems = this.allExercices.filter(e => !courseIds.has(e.id));
        this.loading = false;
      },
      error: () => { this.error = 'Impossible de charger les données.'; this.loading = false; },
    });
  }

  drop(event: CdkDragDrop<DragItem[]>): void {
    const item: DragItem = event.item.data;
    const to = this.computeDropIndex(event);
    if (event.previousContainer === event.container) {
      const from = event.container.data.findIndex((e: DragItem) => e.id === item.id);
      moveItemInArray(event.container.data, from, to);
    } else {
      const from = event.previousContainer.data.findIndex((e: DragItem) => e.id === item.id);
      transferArrayItem(event.previousContainer.data, event.container.data, from, to);
    }
  }

  private computeDropIndex(event: CdkDragDrop<DragItem[]>): number {
    const dropY = event.dropPoint.y;
    const containerEl = event.container.element.nativeElement as HTMLElement;
    const items = Array.from(
      containerEl.querySelectorAll<HTMLElement>('.cdk-drag:not(.cdk-drag-placeholder)')
    );
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (dropY < rect.top + rect.height / 2) {
        return i;
      }
    }
    return items.length;
  }

  applyFilter(): void {
    const courseIds = new Set(this.courseItems.map(e => e.id));
    const q = this.searchQuery.toLowerCase().trim();
    const filtered = this.allExercices
      .filter(e => !courseIds.has(e.id))
      .filter(e => !q || e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q));
    this.availableItems.splice(0, this.availableItems.length, ...filtered);
  }

  removeFromCourse(item: DragItem, index: number): void {
    this.courseItems.splice(index, 1);
    const q = this.searchQuery.toLowerCase().trim();
    if (!q || item.title.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)) {
      this.availableItems.push(item);
    }
  }

  save(): void {
    this.saving = true;
    this.error = '';
    this.successMessage = '';
    const payload = this.courseItems.map((e, i) => ({ id: e.id, order: i + 1 }));
    this.coursService.updateExercices(this.coursId, payload).subscribe({
      next: () => { this.successMessage = 'Exercices mis à jour avec succès.'; this.saving = false; },
      error: () => { this.error = 'Erreur lors de la sauvegarde.'; this.saving = false; },
    });
  }
}
