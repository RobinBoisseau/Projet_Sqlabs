import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Services et Modèles
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { Mcd } from '../../models/mcd';

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
    DictionaryTableComponent,
    DependenceTableComponent,
    McdEditorComponent
  ],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit {
  exercice: Exercice | undefined;
  mcd: Mcd | undefined; 

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
        next: (response: any) => {
          // On déballe les données selon le format Laravel
          this.exercice = response.data ? response.data : response;

          // Traitement sécurisé du MCD
          let rawMcd = (this.exercice as any).mcd_json;
          if (typeof rawMcd === 'string' && rawMcd !== "") {
            try { rawMcd = JSON.parse(rawMcd); } catch (e) { rawMcd = null; }
          }
          
          // Initialisation du MCD intelligent
          this.mcd = Mcd.fromJSON(rawMcd || { Entities: [], Association: [] });
        },
        error: (err) => console.error('Erreur chargement exercice', err)
      });
    }
  }

  nomsTechniques: string[] = [];

  sauvegarder() {
    if (this.exercice && this.mcd) {
      const dataAEnvoyer = JSON.stringify(this.mcd);
      this.exerciceService.saveExerciceProgress(this.exercice.slug, dataAEnvoyer).subscribe({
        next: () => alert("Sauvegardé avec succès !"),
        error: (err) => console.error("Erreur sauvegarde", err)
      });
    }
  }
}