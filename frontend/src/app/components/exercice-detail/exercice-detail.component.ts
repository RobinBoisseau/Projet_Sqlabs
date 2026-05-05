import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ExerciceService } from '../../services/exercice.service';
import { DictionaryService } from '../../services/dictionary.service';
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

  @ViewChild('dependenceTable') dependenceTable!: DependenceTableComponent;

  constructor(
    private route: ActivatedRoute, 
    private exerciceService: ExerciceService,
    private dictService: DictionaryService 
  ) {}

  ngOnInit(): void {
    // 1. CHARGEMENT DE L'HISTORIQUE DU DICTIONNAIRE
    const backup = this.dictService.load();
    if (backup && backup.length > 0) {
      this.allFields = backup;
    }

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (response: any) => {
          this.exercice = response.data ? response.data : response;

          let rawMcd = (this.exercice as any).mcd_json;
          if (typeof rawMcd === 'string' && rawMcd !== "") {
            try { rawMcd = JSON.parse(rawMcd); } catch (e) { rawMcd = null; }
          }
          
          this.mcd = Mcd.fromJSON(rawMcd || { Entities: [], Associations: [], dependence: { lines: [] } });

          // 2. CHARGEMENT DE L'HISTORIQUE DES DÉPENDANCES (DFs)
          // On utilise le slug pour ne pas mélanger les DFs d'un autre exercice
          const dfBackup = localStorage.getItem(`dfs_${slug}`);
          if (dfBackup && this.mcd) {
            try {
              this.mcd.dependence.lines = JSON.parse(dfBackup);
            } catch (e) {
              console.error("Erreur de parsing des DFs stockées", e);
            }
          }
          
          this.refreshAllFields();
        },
        error: (err) => console.error('Erreur chargement exercice', err)
      });
    }
  }

  get nomsPourDependances(): string[] {
    return this.allFields
      .map(f => f.TechnicalName)
      .filter(name => !!name && name.trim() !== '');
  }

  /**
   * Appelé à chaque modification dans le DICTIONNAIRE
   */
  refreshAllFields() {
    this.allFields = [...this.allFields]; 
    this.dictService.save(this.allFields); // Sauvegarde dict
    console.log("Sync Dictionnaire - Noms dispos :", this.nomsPourDependances.length);
  }

  refreshDependences() {
    if (this.mcd && this.exercice) {
      // FORCE la synchronisation : on s'assure que le mcd contient 
      // les dernières modifs de l'enfant avant de mettre en localStorage
      if (this.dependenceTable) {
        this.mcd.dependence.lines = this.dependenceTable.lignes;
      }

      const key = `dfs_${this.exercice.slug}`;
      const data = JSON.stringify(this.mcd.dependence.lines);
      
      localStorage.setItem(key, data);
      
      // Petit log pour confirmer que ça écrit bien quelque chose
      console.log(`Sauvegarde locale (${key}) : ${this.mcd.dependence.lines.length} lignes.`);
    }
  }

  onFieldDeleted(nomTechnique: string) {
    if (this.dependenceTable) {
      this.dependenceTable.nettoyerChampSupprime(nomTechnique);
      this.refreshDependences(); // On sauvegarde après nettoyage
    }
    this.refreshAllFields();
  }

  save() {
    if (this.exercice && this.mcd) {
      const dataAEnvoyer = JSON.stringify(this.mcd);
      this.exerciceService.saveExerciceProgress(this.exercice.slug, dataAEnvoyer).subscribe({
        next: () => {
          alert("Sauvegardé en base de données !");
          // Optionnel : nettoyer le localStorage après une sauvegarde réussie
        },
        error: (err) => console.error("Erreur sauvegarde", err)
      });
    }
  }
}