import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { of, concat } from 'rxjs';
import { switchMap, toArray } from 'rxjs/operators';

import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { Mcd } from '../../models/mcd';
import { Field } from '../../models/field';
import { DependenceLine } from '../../models/dependence-line.model';
import { DictionaryService } from '../../services/dictionary.service';
import { McdService } from '../../services/mcd.service';

import { PanelComponent } from '../panel/panel.component';
import { DictionaryTableComponent } from '../dictionary-table/dictionary-table.component';
import { DependenceTableComponent } from '../dependence-table/dependence-table.component';
import { McdEditorComponent } from '../mcd-editor/mcd-editor.component';
import { TentativeButtonComponent } from '../tentative-button/tentative-button.component';
import { DependenceService } from '../../services/dependence.service';
import { ReturnIaComponent, IaResults } from '../return-ia/return-ia.component';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSplitModule, PanelComponent, DictionaryTableComponent, DependenceTableComponent, McdEditorComponent, TentativeButtonComponent, ReturnIaComponent],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  exercice: Exercice | undefined;
  mcd: Mcd | undefined;
  dictionary: Field[] = [];
  private lastSavedDictionary: Field[] = [];
  dependencies: DependenceLine[] = [];
  technicalNames: string[] = [];

  isLoaded: boolean = false;
  isTentativeDisabled: boolean = false;
  isSubmitting: boolean = false;
  iaResults: IaResults | null = null;
  showIaResults = false;
  hasChangedSinceSubmit = true;
  private currentTentativeId: number | null = null;

  @ViewChild(McdEditorComponent) mcdEditor!: McdEditorComponent;

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService,
    private dictionaryService: DictionaryService,
    private dependenceService: DependenceService,
    private mcdService: McdService,
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

  ngAfterViewInit(): void {
    document.querySelectorAll('as-split-area, as-split').forEach(el => {
      el.removeAttribute('title');
    });
  }

  private getCurrentModel() {
    return this.mcdEditor?.mcd ?? this.mcdService.getCurrentMcd() ?? {};
  }

  private runSilentSave() {
    if (this.exercice && this.isLoaded) {
      const data = {
        dictionary: this.dictionary,
        dependencies: this.dependencies,
        model: this.getCurrentModel()
      };
      this.exerciceService.emergencySave(this.exercice.id, data, this.currentTentativeId);
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

              // 1. Dictionnaire — BD en priorité, localStorage en fallback
              const rawDict = attempt.dictionary || attempt.dictionnaire;
              this.dictionary = rawDict?.length
                ? rawDict
                : this.dictionaryService.load(slug);
              this.lastSavedDictionary = this.deepCopyFields(this.dictionary);

              // 2. Dépendances — BD en priorité, localStorage en fallback
              const rawDeps = attempt.dependencies || attempt.dependance;
              this.dependencies = rawDeps?.length
                ? rawDeps.map((d: any) => DependenceLine.fromJSON(d))
                : this.dependenceService.loadDependences(slug);

              // 3. Nettoyage des noms obsolètes
              const validNames = this.dictionary
                .map((f: any) => f.TechnicalName)
                .filter((n: string) => n && n.trim() !== '');

              this.dependencies = this.dependencies.map(dep => ({
                ...dep,
                source: dep.source.filter(s => validNames.includes(s)),
                cible: dep.cible.filter(c => validNames.includes(c))
              }));

              // 4. MCD depuis BD — priorité si non vide, sinon localStorage
              const rawModel = attempt.model;
              if (rawModel && (rawModel.Entities?.length > 0 || rawModel.Associations?.length > 0)) {
                this.mcd = Mcd.fromJSON(rawModel);
                if (this.exercice?.slug) {
                  this.mcdService.saveMcd(this.exercice.slug, this.mcd);
                }
              } else {
                this.mcd = this.mcdService.loadMcd(slug);
              }

              // ID de la tentative courante — les saves suivants feront un PUT
              this.currentTentativeId = attempt.id ?? null;

              // 5. Sync localStorage
              if (this.exercice?.slug) {
                this.dictionaryService.save(this.exercice.slug, this.dictionary);
                this.dependenceService.saveDependences(this.exercice.slug, this.dependencies);
              }
            } else {
              // Aucune tentative en BD — charger depuis localStorage
              this.dictionary = this.dictionaryService.load(slug);
              this.lastSavedDictionary = this.deepCopyFields(this.dictionary);
              this.dependencies = this.dependenceService.loadDependences(slug);
              this.mcd = this.mcdService.loadMcd(slug);
            }

            this.updateTechnicalNames();
            this.isLoaded = true;
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  // --- 3. SYNCHRONISATION ---
  onDictionaryChanged(updatedLines: Field[]) {
    this.syncDependenciesToDictionary(this.lastSavedDictionary, updatedLines);
    this.dictionary = updatedLines;
    this.lastSavedDictionary = this.deepCopyFields(updatedLines);
    this.updateTechnicalNames();
    this.hasChangedSinceSubmit = true;
    this.isTentativeDisabled = false;

    if (this.exercice && this.isLoaded) {
      this.dictionaryService.save(this.exercice.slug!, this.dictionary);
    }
  }

  private deepCopyFields(fields: Field[]): Field[] {
    return fields.map(f => Field.fromJSON(f));
  }

  private syncDependenciesToDictionary(prevFields: Field[], newFields: Field[]) {
    const newIds = new Set(newFields.map(f => f.id));

    const deletedNames = new Set(
      prevFields.filter(f => !newIds.has(f.id)).map(f => f.TechnicalName).filter(Boolean)
    );

    const renames = new Map<string, string>();
    for (const prev of prevFields) {
      const next = newFields.find(f => f.id === prev.id);
      if (next && prev.TechnicalName && prev.TechnicalName !== next.TechnicalName) {
        renames.set(prev.TechnicalName, next.TechnicalName);
      }
    }

    if (deletedNames.size === 0 && renames.size === 0) return;

    this.dependencies = this.dependencies.map(dep => ({
      ...dep,
      source: dep.source.filter(s => !deletedNames.has(s)).map(s => renames.get(s) ?? s),
      cible: dep.cible.filter(c => !deletedNames.has(c)).map(c => renames.get(c) ?? c),
    }));
  }


  onDependenciesChanged(event: DependenceLine[]) {
    this.dependencies = event;
    this.hasChangedSinceSubmit = true;
    this.isTentativeDisabled = false;

    if (this.exercice && this.isLoaded) {
      this.dependenceService.saveDependences(this.exercice.slug!, this.dependencies);
    }
    this.cdr.detectChanges();
  }

  updateTechnicalNames() {
    this.technicalNames = this.dictionary
      .map(l => l.TechnicalName)
      .filter(n => n && n.trim() !== '');
  }

  // --- 4. SOUMISSION DE TENTATIVE ---

  onTentativeSubmitted(): void {
    console.log('onTentativeSubmitted appelé', this.exercice, this.isLoaded);
    if (!this.exercice || !this.isLoaded) return;

    this.hasChangedSinceSubmit = false;
    this.isTentativeDisabled = true;
    this.isSubmitting = true;

    const data = {
      dictionary: this.dictionary.filter(f =>
        f.TechnicalName && f.TechnicalName.trim() !== ''
      ),
      dependencies: this.dependencies.filter(d =>
        d.source.length > 0 && d.cible.length > 0
      ),
      model: this.getCurrentModel()
    };

    this.exerciceService.saveAttempt(this.exercice.id, data).pipe(
      switchMap((saved: any) => {
        const tentativeId = saved?.data?.id;
        this.currentTentativeId = tentativeId ?? this.currentTentativeId;
        const mcd = saved?.data?.model ?? saved?.model;

        const mcd$ = mcd
          ? this.exerciceService.analyzeMcd(mcd, tentativeId)
          : of(null);

        const dict$ = data.dictionary?.length
          ? this.exerciceService.analyzeDictionary(data.dictionary, tentativeId)
          : of(null);

        const deps$ = data.dependencies?.length
          ? this.exerciceService.analyzeDependencies(data.dependencies, tentativeId)
          : of(null);

        return concat(mcd$, dict$, deps$).pipe(toArray());
      })
    ).subscribe({
      next: ([mcdResult, dictResult, depsResult]) => {
        console.log('mcdResult', mcdResult);
        console.log('dictResult', dictResult);
        console.log('depsResult', depsResult);
        this.iaResults = { mcd: mcdResult, dictionary: dictResult, dependencies: depsResult };
        this.showIaResults = true;
        this.isSubmitting = false;
        this.isTentativeDisabled = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmitting = false;
        this.isTentativeDisabled = true;
      }
    })
  }

  // --- SAUVEGARDE LA TENTATIVE ---

  save(): void {
    if (!this.exercice || !this.isLoaded) return;

    this.hasChangedSinceSubmit = true;
    this.isTentativeDisabled = false;

    const data = {
      dictionary: this.dictionary,
      dependencies: this.dependencies,
      model: this.getCurrentModel()
    };

    if (this.currentTentativeId) {
      this.exerciceService.updateAttempt(this.currentTentativeId, data).subscribe({
        error: () => {}
      });
    } else {
      this.exerciceService.saveAttempt(this.exercice.id, data).subscribe({
        next: (res: any) => { this.currentTentativeId = res?.data?.id ?? null; },
        error: () => {}
      });
    }
  }
}