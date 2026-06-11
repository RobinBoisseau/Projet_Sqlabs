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
  // Source de données brute venant de l'API
  exercices: Exercice[] = [];
  // Liste affichée à l'écran (filtrée)
  filteredExercices: Exercice[] = [];
  
  isLoading = true;
  exerciceToDelete: Exercice | null = null;
  deleteLoading = false;
  deleteError = '';

  private _searchQuery = '';

  // Getter pour le ngModel
  get searchQuery(): string {
    return this._searchQuery;
  }

  // Setter : dès que l'utilisateur écrit, on filtre la liste
  set searchQuery(value: string) {
    this._searchQuery = value;
    this.applyFilter();
  }

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.loadExercices();
  }

  loadExercices(): void {
    this.isLoading = true;
    this.exerciceService.getExercices().subscribe({
      next: (response: any) => {
        // On gère le cas où Laravel renvoie { data: [...] } ou [...]
        this.exercices = response.data || response;
        this.applyFilter(); // Initialise la liste filtrée
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // Logique de filtrage
  applyFilter(): void {
    const query = this._searchQuery.toLowerCase().trim();
    
    if (!query) {
      this.filteredExercices = [...this.exercices];
    } else {
      this.filteredExercices = this.exercices.filter(ex => 
        (ex.title && ex.title.toLowerCase().includes(query)) ||
        (ex.type && ex.type.toLowerCase().includes(query))
      );
    }
  }

  // Actions de suppression
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
        // On supprime de la source locale
        this.exercices = this.exercices.filter(e => e.id !== this.exerciceToDelete!.id);
        // On met à jour l'affichage filtré
        this.applyFilter();
        this.deleteLoading = false;
        this.closeDeleteModal();
      },
      error: () => {
        this.deleteError = 'Une erreur est survenue lors de la suppression.';
        this.deleteLoading = false;
      }
    });
  }
}