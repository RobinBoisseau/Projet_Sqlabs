import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { PanelComponent } from '../panel/panel.component';


@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSplitModule,PanelComponent],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit {
  exercice: Exercice | undefined;
  attributes: any[] = []; // Pour le dictionnaire des données

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService
  ) {}

  ngOnInit(): void {
    // Récupère le texte (slug) de l'URL
    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      // On envoie le slug (string) au service
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (data) => {
          console.log('Donnée reçue du Backend :', data);
          this.exercice = data;
        },
        error: (err) => {
          console.error('Erreur : Exercice introuvable', err);
        }
      });
    }
  }

  addAttribute() {
    this.attributes.push({ nom: '', type: 'INT' });
  }

  removeAttribute(index: number) {
    this.attributes.splice(index, 1);
  }
}