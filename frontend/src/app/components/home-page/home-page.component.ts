import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { filter, take } from 'rxjs';
import { CoursService } from '../../services/cours.service';
import { ClasseService } from '../../services/classe.service';
import { AuthService } from '../../services/auth.service';
import { Cours } from '../../models/cours';
import { Classe } from '../../models/classe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomeComponent implements OnInit {
  cours: Cours[] = [];
  loading = true;
  error = '';

  classes: Classe[] = [];
  classesLoading = false;
  joinCode = '';
  joinError = '';
  joinSuccess = '';
  joinLoading = false;
  isEtudiant = false;
  showJoinForm = false;

  constructor(
    private coursService: CoursService,
    private classeService: ClasseService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.coursService.getCours().subscribe({
      next: data => {
        this.cours = data.filter(c => c.visibility);
        this.loading = false;
      },
      error: () => { this.error = 'Impossible de charger les cours.'; this.loading = false; },
    });

    const user = this.authService.currentUser;
    if (user) {
      this.isEtudiant = user.role === 'etudiant';
      if (this.isEtudiant) this.loadClasses();
    } else {
      this.authService.currentUser$.pipe(
        filter(u => u !== null),
        take(1),
      ).subscribe(u => {
        this.isEtudiant = u?.role === 'etudiant';
        if (this.isEtudiant) this.loadClasses();
      });
    }
  }

  loadClasses(): void {
    this.classesLoading = true;
    this.classeService.getClasses().subscribe({
      next: data => { this.classes = data; this.classesLoading = false; },
      error: () => { this.classesLoading = false; },
    });
  }

  joinClasse(): void {
    if (!this.joinCode.trim()) return;
    this.joinLoading = true;
    this.joinError = '';
    this.joinSuccess = '';
    this.classeService.join(this.joinCode.trim()).subscribe({
      next: classe => {
        this.joinSuccess = `Vous avez rejoint "${classe.nom}" !`;
        this.joinCode = '';
        this.joinLoading = false;
        this.loadClasses();
      },
      error: err => {
        this.joinError = err?.error?.message ?? 'Code incorrect.';
        this.joinLoading = false;
      },
    });
  }

  truncate(text: string, max = 100): string {
    return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
  }
}
