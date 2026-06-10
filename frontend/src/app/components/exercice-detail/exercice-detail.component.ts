import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { AngularSplitModule } from 'angular-split';

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
import { ReturnIaComponent, IaResults, IaItemCheckedEvent } from '../return-ia/return-ia.component';
import { SuccessPageComponent } from '../success-page/success-page.component';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, AngularSplitModule, PanelComponent, DictionaryTableComponent, DependenceTableComponent, McdEditorComponent, TentativeButtonComponent, ReturnIaComponent, SuccessPageComponent],
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

  safeStatement: SafeHtml = '';
  isLoaded: boolean = false;
  isTentativeDisabled: boolean = false;
  isSubmitting: boolean = false;
  iaResults: IaResults | null = null;
  showIaResults = false;
  showSuccessPage = false;
  nextSlug: string | null = null;
  hasChangedSinceSubmit = true;

  // Mode lecture (consultation tentative d'un étudiant)
  isReadOnly = false;
  viewedStudentName = '';

  // Panneau tentatives (admin/prof)
  showTentativesPanel = false;
  panelTentatives: any[] = [];
  panelLoading = false;

  dictionaryIaRemarks = new Map<string, string>();
  dependencyIaRemarks = new Map<string, string>();
  mcdIaRemarks = new Map<string, string>();

  get dictionaryHasError(): boolean {
    return this.iaResults?.dictionary?.remarques
      ?.some(r => r.statut === 'invalide') ?? false;
  }
  get dependenciesHasError(): boolean {
    return this.iaResults?.dependencies?.remarques
      ?.some(r => r.statut === 'invalide') ?? false;
  }
  get mcdHasError(): boolean {
    return this.iaResults?.mcd?.remarques
      ?.some(r => r.statut === 'invalide') ?? false;
  }

  get dictionaryGlobalQuestion(): string {
    return this.dictionaryIaRemarks.get('') ?? '';
  }
  get dependenciesGlobalQuestion(): string {
    return this.dependencyIaRemarks.get('') ?? '';
  }
  get mcdGlobalQuestion(): string {
    return this.mcdIaRemarks.get('') ?? '';
  }

  get iaAllValid(): boolean {
    if (!this.iaResults) return false;
    const ok = (s: { remarques: { statut: string }[] } | null) =>
      !s || s.remarques.every(r => r.statut === 'valide');
    return ok(this.iaResults.mcd) && ok(this.iaResults.dictionary) && ok(this.iaResults.dependencies);
  }
  private currentTentativeId: number | null = null;

  sizes = { enonce: 25, dictionnaire: 30, modelisation: 45 };
  previousSizes = { enonce: 25, dictionnaire: 30, modelisation: 45 };
  isCollapsed = { enonce: false, dictionnaire: false, modelisation: false, dictionnaireV: false, dependancesV: false };

  sizesVertical = { dictionnaire: 50, dependances: 50 };
  previousSizesVertical = { dictionnaire: 50, dependances: 50 };

  @ViewChild(McdEditorComponent) mcdEditor!: McdEditorComponent;

  get isAdminOrProf(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'admin' || role === 'professeur';
  }

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService,
    private dictionaryService: DictionaryService,
    private dependenceService: DependenceService,
    private mcdService: McdService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
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
    if (this.isReadOnly) return;
    const hasWork = this.dictionary.some(f => f.TechnicalName?.trim())
      || this.dependencies.some(d => d.source.length > 0 || d.cible.length > 0);

    if (this.exercice && this.isLoaded && hasWork) {
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
    if (!slug) return;

    this.exerciceService.getExerciceBySlug(slug).subscribe((response: any) => {
      this.exercice = response.data || response;
      this.safeStatement = this.sanitizer.bypassSecurityTrustHtml(this.exercice?.statement ?? '');
      if (!this.exercice?.id) return;

      this.route.queryParams.subscribe(params => {
        const tentativeId = params['tentativeId'];

        if (tentativeId) {
          // Mode lecture : consultation de la tentative d'un étudiant
          this.isReadOnly = true;
          this.isTentativeDisabled = true;
          this.isLoaded = false;
          this.exerciceService.getTentativeById(+tentativeId).subscribe((res: any) => {
            const attempt = res.data || res;
            this.viewedStudentName = attempt.user?.name ?? 'Étudiant';
            this.applyAttemptData(slug, attempt);
          });
        } else {
          // Mode normal : charge la dernière tentative de l'utilisateur
          this.isReadOnly = false;
          this.isTentativeDisabled = false;
          this.viewedStudentName = '';
          this.exerciceService.getExercices().subscribe(all => {
            const idx = all.findIndex(e => e.slug === this.exercice!.slug);
            this.nextSlug = idx >= 0 && idx < all.length - 1 ? all[idx + 1].slug : null;
          });
          this.exerciceService.getLastAttempt(this.exercice!.id).subscribe((res: any) => {
            if (res?.data) {
              this.applyAttemptData(slug, res.data);
              this.currentTentativeId = res.data.id ?? null;
              if (this.exercice?.slug) {
                this.dictionaryService.save(this.exercice.slug, this.dictionary);
                this.dependenceService.saveDependences(this.exercice.slug, this.dependencies);
              }
            } else {
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
    });
  }

  private applyAttemptData(slug: string, attempt: any): void {
    const rawDict = attempt.dictionary || attempt.dictionnaire;
    this.dictionary = rawDict?.length ? rawDict : this.dictionaryService.load(slug);
    this.lastSavedDictionary = this.deepCopyFields(this.dictionary);

    const rawDeps = attempt.dependencies || attempt.dependance;
    this.dependencies = rawDeps?.length
      ? rawDeps.map((d: any) => DependenceLine.fromJSON(d))
      : this.dependenceService.loadDependences(slug);

    const validNames = this.dictionary
      .map((f: any) => f.TechnicalName)
      .filter((n: string) => n?.trim() !== '');
    this.dependencies = this.dependencies.map(dep => ({
      ...dep,
      source: dep.source.filter((s: string) => validNames.includes(s)),
      cible:  dep.cible.filter((c: string) => validNames.includes(c)),
    }));

    const rawModel = attempt.model;
    if (rawModel && (rawModel.Entities?.length > 0 || rawModel.Associations?.length > 0)) {
      this.mcd = Mcd.fromJSON(rawModel);
      if (this.exercice?.slug) this.mcdService.saveMcd(this.exercice.slug, this.mcd);
    } else {
      this.mcd = this.mcdService.loadMcd(slug);
    }

    this.updateTechnicalNames();
    this.isLoaded = true;
    this.cdr.detectChanges();
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

    this.exerciceService.saveAttempt(this.exercice.id, data).subscribe({
      next: (saved: any) => {
        const ia = saved?.ia;
        this.iaResults = {
          mcd:          ia?.mcd          ?? null,
          dictionary:   ia?.dictionary   ?? null,
          dependencies: ia?.dependencies ?? null,
        };
        if (this.iaAllValid) {
          this.showSuccessPage = true;
          this.showIaResults = false;
        } else {
          this.showIaResults = true;
          this.showSuccessPage = false;
        }
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

  onIaItemChecked(event: IaItemCheckedEvent): void {
    const apply = (map: Map<string, string>): Map<string, string> => {
      const m = new Map(map);
      if (event.action === 'add') m.set(event.id, event.message);
      else m.delete(event.id);
      return m;
    };
    if (event.section === 'dictionary')    this.dictionaryIaRemarks  = apply(this.dictionaryIaRemarks);
    else if (event.section === 'dependencies') this.dependencyIaRemarks = apply(this.dependencyIaRemarks);
    else if (event.section === 'mcd')      this.mcdIaRemarks         = apply(this.mcdIaRemarks);
    this.cdr.detectChanges();
  }

  // --- SAUVEGARDE LA TENTATIVE ---

  save(): void {
    if (!this.exercice || !this.isLoaded || this.isReadOnly) return;

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

  // --- PANNEAU TENTATIVES (admin/prof) ---

  openTentativesPanel(): void {
    this.showTentativesPanel = true;
    if (this.panelTentatives.length > 0 || !this.exercice?.slug) return;
    this.panelLoading = true;
    this.exerciceService.getAllTentatives(this.exercice.slug).subscribe({
      next: (res: any) => {
        this.panelTentatives = res.data ?? [];
        this.panelLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.panelLoading = false; },
    });
  }

  toggleTestable(t: any): void {
    this.exerciceService.toggleTestable(t.id).subscribe({
      next: (res) => {
        t.est_testable = res.est_testable;
        this.cdr.detectChanges();
      },
    });
  }

  panelStatut(t: any): string {
    if (t.dictionnaireValide && t.dependanceValide && t.modeleValide) return 'Valide';
    if (t.dictionnaireValide || t.dependanceValide || t.modeleValide) return 'Partiel';
    return 'Non valide';
  }

  panelStatutCss(t: any): string {
    if (t.dictionnaireValide && t.dependanceValide && t.modeleValide) return 'bg-green-100 text-green-700';
    if (t.dictionnaireValide || t.dependanceValide || t.modeleValide) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-600';
  }

  // --- COLLAPSE PANELS ---

  readonly COLLAPSED_SIZE = 4;

  private bestPanelFor(
    exclude: 'enonce' | 'dictionnaire' | 'modelisation'
  ): 'enonce' | 'dictionnaire' | 'modelisation' | null {
    const allPanels: Array<'enonce' | 'dictionnaire' | 'modelisation'> =
      this.exercice?.type === 'SQL'
        ? ['enonce', 'dictionnaire', 'modelisation']
        : ['enonce', 'modelisation'];

    const candidates = allPanels.filter(p => p !== exclude && !this.isCollapsed[p]);
    if (candidates.length === 0) return null;
    return candidates.reduce((best, p) => this.sizes[p] > this.sizes[best] ? p : best);
  }

  togglePanel(panel: 'enonce' | 'dictionnaire' | 'modelisation'): void {
    if (this.isCollapsed[panel]) {
      const toRestore = this.previousSizes[panel];
      const donor = this.bestPanelFor(panel);
      const newSizes = { ...this.sizes, [panel]: toRestore };
      if (donor) newSizes[donor] = this.sizes[donor] - (toRestore - this.COLLAPSED_SIZE);
      this.sizes = newSizes;
      this.isCollapsed = { ...this.isCollapsed, [panel]: false };
    } else {
      const freed = this.sizes[panel] - this.COLLAPSED_SIZE;
      const recipient = this.bestPanelFor(panel);
      this.previousSizes = { ...this.previousSizes, [panel]: this.sizes[panel] };
      const newSizes = { ...this.sizes, [panel]: this.COLLAPSED_SIZE };
      if (recipient) newSizes[recipient] = this.sizes[recipient] + freed;
      this.sizes = newSizes;
      this.isCollapsed = { ...this.isCollapsed, [panel]: true };
    }
  }

  toggleVerticalPanel(panel: 'dictionnaire' | 'dependances'): void {
    const key: 'dictionnaireV' | 'dependancesV' =
      panel === 'dictionnaire' ? 'dictionnaireV' : 'dependancesV';
    const partner: 'dictionnaire' | 'dependances' =
      panel === 'dictionnaire' ? 'dependances' : 'dictionnaire';

    if (this.isCollapsed[key]) {
      const toRestore = this.previousSizesVertical[panel];
      this.sizesVertical = {
        ...this.sizesVertical,
        [panel]: toRestore,
        [partner]: this.sizesVertical[partner] - (toRestore - this.COLLAPSED_SIZE)
      };
      this.isCollapsed = { ...this.isCollapsed, [key]: false };
    } else {
      const freed = this.sizesVertical[panel] - this.COLLAPSED_SIZE;
      this.previousSizesVertical = { ...this.previousSizesVertical, [panel]: this.sizesVertical[panel] };
      this.sizesVertical = {
        ...this.sizesVertical,
        [panel]: this.COLLAPSED_SIZE,
        [partner]: this.sizesVertical[partner] + freed
      };
      this.isCollapsed = { ...this.isCollapsed, [key]: true };
    }
  }
}