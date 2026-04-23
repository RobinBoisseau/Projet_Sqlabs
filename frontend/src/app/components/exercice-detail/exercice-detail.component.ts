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
    // On récupère le "slug" depuis l'URL
    const slug = this.route.snapshot.paramMap.get('slug');
  
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe(data => {
        this.exercice = data;
      });
    }
  }
}