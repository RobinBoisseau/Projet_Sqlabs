import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClasseService } from '../../../services/classe.service';
import { McdEditorComponent } from '../../mcd-editor/mcd-editor.component';
import { Mcd } from '../../../models/mcd';

@Component({
  selector: 'app-tentative-viewer',
  standalone: true,
  imports: [CommonModule, McdEditorComponent],
  templateUrl: './tentative-viewer.component.html',
  styleUrl: './tentative-viewer.component.css',
})
export class TentativeViewerComponent implements OnInit {
  @Input() studentName = '';
  @Input() classeId = 0;
  @Input() exerciceSlug = '';
  @Input() userId = 0;
  @Output() closed = new EventEmitter<void>();

  tentatives: any[] = [];
  loading = true;
  error = '';
  currentIndex = 0;
  activeTab: 'dictionary' | 'dependencies' | 'model' = 'dictionary';

  constructor(private classeService: ClasseService) {}

  ngOnInit(): void {
    this.classeService.getStudentTentatives(this.classeId, this.exerciceSlug, this.userId).subscribe({
      next: data => {
        this.tentatives = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les tentatives.';
        this.loading = false;
      },
    });
  }

  get currentTentative(): any {
    return this.tentatives[this.currentIndex] ?? null;
  }

  get currentMcd(): Mcd | undefined {
    if (!this.currentTentative?.model) return undefined;
    return Mcd.fromJSON(this.currentTentative.model);
  }

  get mcdSlug(): string {
    return `viewer-${this.userId}-${this.exerciceSlug}`;
  }

  goTo(index: number): void {
    this.currentIndex = index;
  }

  prev(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  next(): void {
    if (this.currentIndex < this.tentatives.length - 1) this.currentIndex++;
  }

  allValid(t: any): boolean {
    return t.dictionnaireValide && t.dependanceValide && t.modeleValide;
  }

  hasAnyValid(t: any): boolean {
    return t.dictionnaireValide || t.dependanceValide || t.modeleValide;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
