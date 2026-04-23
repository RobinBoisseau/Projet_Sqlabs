import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';


@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [CommonModule, AngularSplitModule],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit {
  exercice: Exercice | undefined;

  constructor(
    private route: ActivatedRoute,       // Pour lire l'ID dans l'URL
    private exerciceService: ExerciceService // Ton service Laravel
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    console.log('Slug détecté dans l URL :', slug);

    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (data) => {
          console.log('Donnée reçue du Backend :', data);
          this.exercice = data;
        },
        error: (err) => {
          console.error('Erreur lors de la récupération :', err);
        }
      });
    }
  }
}