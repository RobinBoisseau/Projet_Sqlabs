import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExerciceService } from '../../../services/exercice.service';
import { Exercice } from '../../../models/exercice';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-exercice-admin-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './exercice-admin-list.component.html',
})
export class ExerciceAdminListComponent implements OnInit {
    exercices: Exercice[] = [];
    isLoading = true;
    exerciceToDelete: Exercice | null = null;
    deleteLoading = false;
    deleteError = '';


    constructor(private exerciceService: ExerciceService) { }

    ngOnInit(): void {
        this.exerciceService.getExercices().subscribe({
            next: (data) => { this.exercices = data; this.isLoading = false; },
            error: () => { this.isLoading = false; }
        });
    }

    searchQuery = '';

    get filteredExercices(): Exercice[] {
        if (!this.searchQuery.trim()) return this.exercices;
        const q = this.searchQuery.toLowerCase();
        return this.exercices.filter(ex =>
            ex.title.toLowerCase().includes(q) ||
            ex.type.toLowerCase().includes(q) ||
            (ex.etat ?? '').toLowerCase().includes(q)
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