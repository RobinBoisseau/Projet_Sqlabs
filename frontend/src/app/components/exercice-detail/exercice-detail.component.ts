import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { Mcd } from '../../models/mcd';
import { Field } from '../../models/field';

// Composants enfants
import { PanelComponent } from '../panel/panel.component';
import { DictionaryTableComponent } from '../dictionary-table/dictionary-table.component';
import { DependenceTableComponent } from '../dependence-table/dependence-table.component';
import { McdEditorComponent } from '../mcd-editor/mcd-editor.component';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, AngularSplitModule, DragDropModule,
    PanelComponent, DictionaryTableComponent, DependenceTableComponent, McdEditorComponent
  ],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit {
  exercice: Exercice | undefined;
  mcd: Mcd | undefined; 
  allFields: Field[] = [];
  nomsTechniques: string[] = [];

  constructor(
    private route: ActivatedRoute, 
    private exerciceService: ExerciceService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (response: any) => {
          this.exercice = response.data ? response.data : response;

          let rawMcd = (this.exercice as any).mcd_json;
          if (typeof rawMcd === 'string' && rawMcd !== "") {
            try { rawMcd = JSON.parse(rawMcd); } catch (e) { rawMcd = null; }
          }
          
          this.mcd = Mcd.fromJSON(rawMcd || { Entities: [], Association: [] });
          
          // On synchronise les champs pour le tableau
          this.refreshAllFields();
        },
        error: (err) => console.error('Erreur chargement exercice', err)
      });
    }
  }

  // Extrait tous les Fields de toutes les Entities (Respect UML)
  refreshAllFields() {
    if (!this.mcd) return;

    // On récupère les champs actuels du MCD
    const nouveauxChamps = this.mcd.Entities.flatMap(entity => entity.fields || []);

    // TECHNIQUE DE LA RÉFÉRENCE : 
    // On ne change nomsTechniques que pour les dépendances
    this.nomsTechniques = nouveauxChamps.map(f => f.TechnicalName).filter(n => !!n);

    // SURTOUT : On ne réassigne JAMAIS this.allFields ici si elle existe déjà.
    // Puisque DictionaryTable travaille déjà sur cette liste par référence, 
    // elle est déjà à jour !
    if (this.allFields.length === 0) {
      this.allFields = nouveauxChamps;
    }
  }

  sauvegarder() {
    if (this.exercice && this.mcd) {
      const dataAEnvoyer = JSON.stringify(this.mcd);
      this.exerciceService.saveExerciceProgress(this.exercice.slug, dataAEnvoyer).subscribe({
        next: () => alert("Sauvegardé sur le serveur !"),
        error: (err) => console.error("Erreur sauvegarde", err)
      });
    }
  }
}