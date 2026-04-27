import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { PanelComponent } from '../panel/panel.component';
import { AddButtonComponent} from '../add-button/add-button.component';
import { ToolButtonComponent } from '../toll-button/toll-button.component';


@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSplitModule,PanelComponent,AddButtonComponent,ToolButtonComponent],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit {
  exercice: Exercice | undefined;
  attributes: any[] = [];
  dependances: any[] = [];
  entities: any[] = [];
  schemaAttributes: any[] = [];
  relations: any[] = [];

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
  addDependance() {
    this.dependances.push({ gauche: '', droite: '' });
    console.log("Dépendance ajoutée !");
  }

  addEntity() {
    this.entities.push({ 
      id: Date.now(),
      nom: 'NOUVELLE_ENTITE', 
      x: 50, 
      y: 50 
    });
    console.log("Ajout d'une entité sur la grille...");
}

addAttributeToSchema() {
   this.schemaAttributes.push({
      id: Date.now(),
      nom: 'attribut_1',
      x: 120, // Position initiale sur la grille
      y: 120
    });
  console.log("Ajout d'un attribut sur la grille...");
}

addRelation() {
  this.relations.push({ 
      id: Date.now(), 
      nom: 'RELATION', 
      x: 150, 
      y: 150 
    });
  console.log("Ajout d'une relation sur la grille...");
}

  removeAttribute(index: number) {
    this.attributes.splice(index, 1);
  }

  removeDependance(index: number) {
    this.dependances.splice(index, 1);
  }

  // Supprimer une entité du schéma
  removeEntity(index: number): void {
    this.entities.splice(index, 1);
  }

  // Supprimer un attribut du schéma
  removeSchemaAttribute(index: number): void {
    this.schemaAttributes.splice(index, 1);
  }

  // Supprimer une relation du schéma
  removeRelation(index: number): void {
    this.relations.splice(index, 1);
  }
}