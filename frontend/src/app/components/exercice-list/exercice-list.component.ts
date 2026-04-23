import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSplitModule } from 'angular-split'; // Importation
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';

@Component({
  selector: 'app-exercice-list',
  standalone: true,
  imports: [
    CommonModule, 
    AngularSplitModule // Ajout ici
  ],
  templateUrl: './exercice-list.component.html',
  styleUrls: ['./exercice-list.component.css']
})
export class ExerciceListComponent implements OnInit {
  exercices: Exercice[] = [];

  constructor(private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    this.exerciceService.getExercices().subscribe(data => {
      this.exercices = data;
    });
  }
}