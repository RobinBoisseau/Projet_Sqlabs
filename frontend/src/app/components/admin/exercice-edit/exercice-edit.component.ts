import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AngularSplitModule } from 'angular-split';

declare const Quill: any;

import { ExerciceService } from '../../../services/exercice.service';
import { DictionaryService } from '../../../services/dictionary.service';
import { DependenceService } from '../../../services/dependence.service';
import { McdService } from '../../../services/mcd.service';

import { Field } from '../../../models/field';
import { DependenceLine } from '../../../models/dependence-line.model';
import { Mcd } from '../../../models/mcd';

import { PanelComponent } from '../../panel/panel.component';
import { DictionaryTableComponent } from '../../dictionary-table/dictionary-table.component';
import { DependenceTableComponent } from '../../dependence-table/dependence-table.component';
import { McdEditorComponent } from '../../mcd-editor/mcd-editor.component';

@Component({
    selector: 'app-exercice-edit',
    standalone: true,
    imports: [
        CommonModule, FormsModule, AngularSplitModule, RouterModule,
        PanelComponent, DictionaryTableComponent,
        DependenceTableComponent, McdEditorComponent
    ],
    templateUrl: './exercice-edit.component.html',
    styleUrl: './exercice-edit.component.css',
})
export class ExerciceEditComponent implements OnInit, AfterViewInit, OnDestroy {

    titre = '';
    enonce = '';
    type: 'SQL' | 'BPMN' = 'SQL';

    dictionary: Field[] = [];
    dependencies: DependenceLine[] = [];
    mcd: Mcd = new Mcd([], [], []);
    technicalNames: string[] = [];

    currentSlug = '';
    isLoaded = false;
    isSaving = false;
    errorMessage = '';

    sizes = { enonce: 25, dictionnaire: 30, modelisation: 45 };
    previousSizes = { enonce: 25, dictionnaire: 30, modelisation: 45 };
    isCollapsed = {
        enonce: false, dictionnaire: false, modelisation: false,
        dictionnaireV: false, dependancesV: false
    };

    sizesVertical = { dictionnaire: 50, dependances: 50 };
    previousSizesVertical = { dictionnaire: 50, dependances: 50 };

    readonly COLLAPSED_SIZE = 4;

    get editSlug(): string { return `__edit__${this.currentSlug}`; }

    @ViewChild(McdEditorComponent) mcdEditor!: McdEditorComponent;
    @ViewChild('quillEditor') quillEditorRef!: ElementRef;

    private quillInstance: any;

    constructor(
        private route: ActivatedRoute,
        private exerciceService: ExerciceService,
        private dictionaryService: DictionaryService,
        private dependenceService: DependenceService,
        private mcdService: McdService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get('slug');
        if (!slug) return;
        this.currentSlug = slug;

        this.exerciceService.getCorrection(slug).subscribe({
            next: (res) => {
                const ex = res.exercice?.data ?? res.exercice;
                this.titre = ex.title ?? '';
                this.type  = ex.type ?? 'SQL';
                this.enonce = ex.statement ?? '';

                if (this.quillInstance && this.enonce) {
                    this.quillInstance.root.innerHTML = this.enonce;
                }

                if (res.correction) {
                    this.dictionary   = res.correction.dictionary ?? [];
                    this.dependencies = (res.correction.dependencies ?? [])
                        .map((d: any) => DependenceLine.fromJSON(d));
                    const model = res.correction.model;
                    this.mcd = model && (model.Entities?.length > 0 || model.Associations?.length > 0)
                        ? Mcd.fromJSON(model)
                        : new Mcd([], [], []);
                }

                this.technicalNames = this.dictionary
                    .map((f: any) => f.TechnicalName)
                    .filter((n: string) => n?.trim());

                this.isLoaded = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.errorMessage = `Impossible de charger l'exercice (${err?.status ?? 'réseau'}).`;
                this.cdr.detectChanges();
            }
        });
    }

    ngAfterViewInit(): void {
        document.querySelectorAll('as-split-area, as-split').forEach(el => {
            el.removeAttribute('title');
        });

        setTimeout(() => {
            if (this.quillEditorRef?.nativeElement) {
                this.quillInstance = new Quill(this.quillEditorRef.nativeElement, {
                    theme: 'snow',
                    placeholder: 'Rédigez l\'énoncé de l\'exercice…',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }]
                        ]
                    }
                });

                if (this.enonce) {
                    this.quillInstance.root.innerHTML = this.enonce;
                }

                this.quillInstance.on('text-change', () => {
                    this.enonce = this.quillInstance.root.innerHTML;
                });
            }
        }, 0);
    }

    ngOnDestroy(): void {
        this.dictionaryService.save(this.editSlug, []);
        this.dependenceService.saveDependences(this.editSlug, []);
        this.mcdService.clearCache(this.editSlug);
    }

    // --- Données ---

    onDictionaryChanged(updatedLines: Field[]): void {
        this.dictionary = updatedLines;
        this.technicalNames = updatedLines
            .map(f => f.TechnicalName)
            .filter(n => n && n.trim() !== '');
        this.dictionaryService.save(this.editSlug, this.dictionary);
    }

    onDependenciesChanged(event: DependenceLine[]): void {
        this.dependencies = event;
        this.dependenceService.saveDependences(this.editSlug, this.dependencies);
        this.cdr.detectChanges();
    }

    // --- Sauvegarde ---

    onSave(): void {
        const htmlEnonce = this.quillInstance?.root.innerHTML ?? this.enonce;
        const plainEnonce = this.quillInstance?.getText().trim() ?? this.enonce.trim();

        if (!this.titre.trim() || !plainEnonce) {
            this.errorMessage = 'Le titre et l\'énoncé sont obligatoires.';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';

        const data = {
            titre: this.titre.trim(),
            enonce: htmlEnonce,
            type: this.type,
            dictionary: this.dictionary.filter(f => f.TechnicalName?.trim()),
            dependencies: this.dependencies.filter(d => d.source.length > 0 && d.cible.length > 0),
            model: this.mcdEditor?.mcd ?? this.mcd
        };

        this.exerciceService.updateExercice(this.currentSlug, data).subscribe({
            next: () => {
                this.isSaving = false;
                this.router.navigate(['/admin/exercices']);
            },
            error: (err) => {
                this.errorMessage = `Erreur lors de la modification (${err?.status ?? 'réseau'}).`;
                this.isSaving = false;
            }
        });
    }

    // --- Collapse horizontal ---

    private bestPanelFor(
        exclude: 'enonce' | 'dictionnaire' | 'modelisation'
    ): 'enonce' | 'dictionnaire' | 'modelisation' | null {
        const all: Array<'enonce' | 'dictionnaire' | 'modelisation'> =
            ['enonce', 'dictionnaire', 'modelisation'];
        const candidates = all.filter(p => p !== exclude && !this.isCollapsed[p]);
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

    // --- Collapse vertical (colonne 2) ---

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
