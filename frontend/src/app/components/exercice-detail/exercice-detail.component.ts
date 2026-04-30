import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Services et Modèles
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';

// Composants enfants
import { PanelComponent } from '../panel/panel.component';
import { AddButtonComponent } from '../add-button/add-button.component';
import { ToolButtonComponent } from '../toll-button/toll-button.component';
import { DictionaryTableComponent } from '../dictionary-table/dictionary-table.component';
import { DependenceTableComponent } from '../dependence-table/dependence-table.component';
import { McdEditorComponent } from '../mcd-editor/mcd-editor.component'; // <--- Ton nouveau bébé

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AngularSplitModule, 
    DragDropModule,
    PanelComponent, 
    AddButtonComponent, 
    ToolButtonComponent,
    DictionaryTableComponent,
    DependenceTableComponent,
    McdEditorComponent // <--- On l'ajoute ici pour qu'Angular le reconnaisse
  ],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit {
  exercice: Exercice | undefined;

  // On crée une référence pour piloter l'éditeur MCD (l'enfant) depuis le parent
  @ViewChild(McdEditorComponent) mcdEditor!: McdEditorComponent;

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService
  ) {}

  ngOnInit(): void {
    // 1. Récupération du slug dans l'URL
    const slug = this.route.snapshot.paramMap.get('slug');
    
    if (slug) {
      // 2. Appel à l'API Laravel pour avoir les infos de l'exo
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (data) => {
          this.exercice = data;
          console.log("Exercice chargé :", this.exercice.titre);
        },
        error: (err) => console.error('Erreur API Laravel :', err)
      });
    }
  }

  // --- ACTIONS DE LA TOOLBAR (Pilotage de l'enfant) ---
  // Ces fonctions sont appelées par les (toolClick) dans ton HTML

  addEntity() {
    // On dit à l'éditeur MCD d'ajouter une entité
    this.mcdEditor.addEntity();
  }


  addAssociation() {
    // On dit à l'éditeur MCD d'ajouter une association Merise
    this.mcdEditor.addAssociation();
  }

  // --- LOGIQUE DE SAUVEGARDE IA (À venir) ---
  saveWork() {
    console.log("On récupérera ici le JSON du dictionnaire + du MCD pour l'IA");
    // Toi et moi on codera ça plus tard mon gaté !
  }
}