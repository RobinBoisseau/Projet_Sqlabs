import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExerciceService } from '../../../services/exercice.service';

interface Exercice {
  id: number;
  title: string;
  type: string;
  slug: string;
  visibility: boolean;
}

@Component({
  selector: 'app-exercice-admin-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './exercice-admin-list.component.html',
})
export class ExerciceAdminListComponent implements OnInit {
  exercices: Exercice[] = [];
  filteredExercices: Exercice[] = [];
  isLoading = true;
  searchQuery = '';
  exerciceToDelete: Exercice | null = null;
  deleteLoading = false;
  deleteError = '';

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.exerciceService.getExercices().subscribe({
      next: (data: any) => {
        this.exercices = data;
        this.filteredExercices = this.exercices;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get searchQueryValue() { return this.searchQuery; }
  set searchQueryValue(val: string) {
    this.searchQuery = val;
    this.filteredExercices = this.exercices.filter(ex =>
      ex.title?.toLowerCase().includes(val.toLowerCase()) ||
      ex.type?.toLowerCase().includes(val.toLowerCase())
    );
  }

  openDeleteModal(ex: Exercice): void {
    this.exerciceToDelete = ex;
    this.deleteError = '';
  }

  closeDeleteModal(): void {
    this.exerciceToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.exerciceToDelete) return;
    this.deleteLoading = true;
    this.exerciceService.deleteExercice(this.exerciceToDelete.id).subscribe({
      next: () => {
        this.exercices = this.exercices.filter(e => e.id !== this.exerciceToDelete!.id);
        this.filteredExercices = this.filteredExercices.filter(e => e.id !== this.exerciceToDelete!.id);
        this.deleteLoading = false;
        this.closeDeleteModal();
      },
      error: () => {
        this.deleteError = 'Erreur lors de la suppression.';
        this.deleteLoading = false;
      }
    });
  }
}
