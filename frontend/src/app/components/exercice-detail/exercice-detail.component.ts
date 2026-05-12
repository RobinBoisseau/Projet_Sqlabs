import { Component, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { Observable, of } from 'rxjs';

import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { Mcd } from '../../models/mcd';
import { Field } from '../../models/field';
import { DependenceLine } from '../../models/dependence-line.model';
import { DictionaryService } from '../../services/dictionary.service';

import { PanelComponent } from '../panel/panel.component';
import { DictionaryTableComponent } from '../dictionary-table/dictionary-table.component';
import { DependenceTableComponent } from '../dependence-table/dependence-table.component';
import { McdEditorComponent } from '../mcd-editor/mcd-editor.component';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSplitModule, PanelComponent, DictionaryTableComponent, DependenceTableComponent, McdEditorComponent],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit, OnDestroy {
  exercice: Exercice | undefined;
  mcd: Mcd | undefined;
  dictionary: Field[] = [];
  dependencies: DependenceLine[] = [];
  technicalNames: string[] = [];

  // Sécurité : empêche d'envoyer du vide si Laravel n'a pas encore répondu au début
  isLoaded: boolean = false;

  @ViewChild(McdEditorComponent) mcdEditor!: McdEditorComponent;

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService,
    private dictionaryService: DictionaryService,
    private cdr: ChangeDetectorRef
  ) { }

  // --- 1. SAUVEGARDE AUTOMATIQUE (Navigation et Fermeture) ---

  @HostListener('window:beforeunload')
  beforeUnloadHandler() {
    this.runSilentSave();
  }

  @HostListener('window:keydown.control.s', ['$event'])
  onCtrlS(event: Event) {
    event.preventDefault();
    this.save();
  }

  ngOnDestroy(): void {
    console.log("🚶 [ngOnDestroy] Sortie de page détectée.");
    this.runSilentSave();
  }

  private runSilentSave() {
    if (this.exercice && this.isLoaded) {
      const data = {
        dictionary: this.dictionary,
        dependencies: this.dependencies,
        model: {} // --- ON ENVOIE UN MCD VIDE ICI ---
      };

      console.log("💾 [AUTO-SAVE] Données envoyées à Laravel :", data);

      // On utilise emergencySave (fetch keepalive) pour passer outre l'erreur status: 0
      this.exerciceService.emergencySave(this.exercice.id, data);

      // --- LOG DE CONFIRMATION ---
      console.log("✅ [AUTO-SAVE] La structure MCD vide a bien été envoyée au service.");
    } else {
      console.warn("⚠️ [AUTO-SAVE] Annulée : les données n'étaient pas prêtes.");
    }
  }

  // --- 2. CHARGEMENT INITIAL (Auto-load) ---

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe((response: any) => {
        this.exercice = response.data || response;

        if (this.exercice?.id) {
          this.exerciceService.getLastAttempt(this.exercice.id).subscribe((res: any) => {
            if (res && res.data) {
              const attempt = res.data;
              console.log("📥 [LOAD] Données brutes lues en BD :", attempt);

              this.dictionary = attempt.dictionary || attempt.dictionnaire || [];
              this.dependencies = attempt.dependencies || attempt.dependance
                ? (attempt.dependencies || attempt.dependance).map((d: any) => DependenceLine.fromJSON(d))
                : [];

              this.updateTechnicalNames();
              console.log("✨ [LOAD] État restauré. Dico lignes :", this.dictionary.length);
            }

            this.isLoaded = true;
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  // --- 3. SYNCHRONISATION ---
  onDictionaryChanged(updatedLines: Field[]) {
    // On met à jour la variable locale
    this.dictionary = [...updatedLines];

    // On met à jour les noms techniques (pour les dépendances fonctionnelles)
    this.updateTechnicalNames();

    // SAUVEGARDE CRUCIALE : On écrase l'ancien dictionnaire dans le localStorage
    if (this.exercice?.slug) {
      this.dictionaryService.save(this.exercice.slug, this.dictionary);
      console.log("🗑️ Ligne supprimée et dictionnaire mis à jour pour :", this.exercice.slug);
    }
  }


  onDependenciesChanged(event: DependenceLine[]) {
    this.dependencies = event;
    console.log("🔄 [SYNC] Dépendances mises à jour dans le parent.");
    this.cdr.detectChanges();
  }

  updateTechnicalNames() {
    this.technicalNames = this.dictionary
      .map(l => l.TechnicalName)
      .filter(n => n && n.trim() !== '');
  }

  // --- 4. SAUVEGARDE MANUELLE ---

  save(): void {
    if (!this.exercice || !this.isLoaded) return;

    const data = {
      dictionary: this.dictionary,
      dependencies: this.dependencies,
      model: {}
    };

    this.exerciceService.saveAttempt(this.exercice.id, data).subscribe();
  }
}