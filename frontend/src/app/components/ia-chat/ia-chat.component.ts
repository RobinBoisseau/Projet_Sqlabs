import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ia-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ia-chat.component.html',
})
export class IaChatComponent {
  reponse = '';
  reponseMcd: { entite: string | null; statut: 'valide' | 'invalide'; message: string }[] = [];
  reponseMcdJson = '';
  loading = false;
  loadingMcd = false;
  erreur = '';

  constructor(private http: HttpClient) {}

  interroger() {
    this.loading = true;
    this.reponse = '';
    this.erreur = '';

    this.http.post<{ reponse: string }>('http://localhost:8000/api/ia/ask', {
      prompt: 'Est-ce qu\'il fait beau aujourd\'hui ?'
    }).subscribe({
      next: (res) => { this.reponse = res.reponse; this.loading = false; },
      error: () => { this.erreur = 'Erreur lors de l\'appel à l\'IA.'; this.loading = false; }
    });
  }

  analyserMcd() {
    this.loadingMcd = true;
    this.reponseMcd = [];
    this.erreur = '';

    this.http.get<{ remarques: { entite: string | null; statut: 'valide' | 'invalide'; message: string }[] }>('http://localhost:8000/api/ia/analyze-mcd')
      .subscribe({
        next: (res) => {
          this.reponseMcd = res.remarques;
          this.reponseMcdJson = JSON.stringify(res.remarques, null, 2);
          this.loadingMcd = false;
        },
        error: () => { this.erreur = 'Erreur lors de l\'analyse du MCD.'; this.loadingMcd = false; }
      });
  }
}
