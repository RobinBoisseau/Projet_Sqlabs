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
    // 1. On récupère l'ID passé dans l'URL (le :id)
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // 2. On demande à Laravel les infos de cet exercice précis
    if (id) {
      this.exerciceService.getExercice(id).subscribe({
        next: (data) => {
          this.exercice = data;
        },
        error: (err) => console.error('Erreur lors de la récupération de l\'exercice', err)
      });
    }
  }
}