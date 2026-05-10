import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClasseService } from '../../../services/classe.service';
import { Classe } from '../../../models/classe';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './class-list.component.html',
})
export class ClassListComponent implements OnInit {
  classes: Classe[] = [];
  loading = true;
  error = '';

  joinCode = '';
  joining = false;
  joinError = '';
  joinSuccess = '';

  constructor(private classeService: ClasseService) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  private loadClasses(): void {
    this.loading = true;
    this.classeService.getClasses().subscribe({
      next: classes => { this.classes = classes; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les classes.'; this.loading = false; },
    });
  }

  join(): void {
    const code = this.joinCode.trim();
    if (!code) return;
    this.joining = true;
    this.joinError = '';
    this.joinSuccess = '';
    this.classeService.join(code).subscribe({
      next: () => {
        this.joinSuccess = 'Vous avez rejoint la classe avec succès.';
        this.joinCode = '';
        this.joining = false;
        this.loadClasses();
      },
      error: (err) => {
        this.joinError = err.error?.message || 'Code invalide ou classe introuvable.';
        this.joining = false;
      },
    });
  }
}
