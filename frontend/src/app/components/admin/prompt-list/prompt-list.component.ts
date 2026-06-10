import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PromptService } from '../../../services/prompt.service';
import { Prompt } from '../../../models/prompt';

@Component({
  selector: 'app-prompt-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './prompt-list.component.html',
})
export class PromptListComponent implements OnInit {
  prompts: Prompt[] = [];
  filteredPrompts: Prompt[] = [];
  isLoading = true;
  searchQuery = '';
  expandedId: number | null = null;
  promptToDelete: Prompt | null = null;
  deleteLoading = false;

  readonly categorieLabels: Record<string, string> = {
    mcd: 'MCD',
    dd: 'Dictionnaire',
    df: 'Dépendances',
  };

  constructor(private promptService: PromptService) {}

  ngOnInit(): void {
    this.promptService.getAll().subscribe({
      next: (data) => {
        this.prompts = data;
        this.filteredPrompts = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get searchQueryValue() { return this.searchQuery; }
  set searchQueryValue(val: string) {
    this.searchQuery = val;
    this.filteredPrompts = this.prompts.filter(p =>
      p.nom?.toLowerCase().includes(val.toLowerCase()) ||
      p.categorie?.toLowerCase().includes(val.toLowerCase())
    );
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  openDeleteModal(p: Prompt): void {
    this.promptToDelete = p;
  }

  closeDeleteModal(): void {
    this.promptToDelete = null;
  }

  confirmDelete(): void {
    if (!this.promptToDelete) return;
    this.deleteLoading = true;
    this.promptService.delete(this.promptToDelete.id).subscribe({
      next: () => {
        this.prompts = this.prompts.filter(p => p.id !== this.promptToDelete!.id);
        this.filteredPrompts = this.filteredPrompts.filter(p => p.id !== this.promptToDelete!.id);
        this.deleteLoading = false;
        this.closeDeleteModal();
      },
      error: () => { this.deleteLoading = false; }
    });
  }
}
