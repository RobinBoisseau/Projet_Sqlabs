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
import { DependenceService } from '../../services/dependence.service';

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
    private dependenceService: DependenceService,
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

              // 1. Dictionnaire
              this.dictionary = attempt.dictionary || attempt.dictionnaire || [];

              // 2. Dépendances — BD en priorité, localStorage en fallback
              const rawDeps = attempt.dependencies || attempt.dependance;
              console.log('📥 rawDeps depuis BD:', rawDeps);
              console.log('📥 localStorage deps:', this.dependenceService.loadDependences(slug));
              this.dependencies = rawDeps?.length
                ? rawDeps.map((d: any) => DependenceLine.fromJSON(d))
                : this.dependenceService.loadDependences(slug); // ✅ fallback

              // 3. Nettoyage des noms obsolètes
              const validNames = this.dictionary
                .map((f: any) => f.TechnicalName)
                .filter((n: string) => n && n.trim() !== '');

              this.dependencies = this.dependencies.map(dep => ({
                ...dep,
                source: dep.source.filter(s => validNames.includes(s)),
                cible: dep.cible.filter(c => validNames.includes(c))
              }));

              // 4. Sync localStorage
              if (this.exercice?.slug) {
                this.dictionaryService.save(this.exercice.slug, this.dictionary);
                this.dependenceService.saveDependences(this.exercice.slug, this.dependencies);
              }

              this.updateTechnicalNames();
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
    this.dictionary = updatedLines;
    this.updateTechnicalNames();

    if (this.exercice && this.isLoaded) {
      this.dictionaryService.save(this.exercice.slug!, this.dictionary);

      const data = {
        dictionary: this.dictionary,
        dependencies: this.dependencies,
        model: {}
      };
      this.exerciceService.saveAttempt(this.exercice.id, data).subscribe();
    }
  }


  onDependenciesChanged(event: DependenceLine[]) {
    this.dependencies = event;
    console.log('💾 deps à sauvegarder:', JSON.stringify(event));
    console.log('📦 onDependenciesChanged appelé, isLoaded:', this.isLoaded, 'nb lignes:', event.length);

    if (this.exercice && this.isLoaded) {
      this.dependenceService.saveDependences(this.exercice.slug!, this.dependencies);
      console.log('✅ Dépendances sauvegardées dans localStorage');
    }
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