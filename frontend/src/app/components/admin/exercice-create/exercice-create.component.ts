import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

import { RouterModule } from '@angular/router';


@Component({
    selector: 'app-exercice-create',
    standalone: true,
    imports: [
        CommonModule, FormsModule, AngularSplitModule, RouterModule,
        PanelComponent, DictionaryTableComponent,
        DependenceTableComponent, McdEditorComponent
    ],
    templateUrl: './exercice-create.component.html',
    styleUrl: './exercice-create.component.css',
})
export class ExerciceCreateComponent implements AfterViewInit, OnDestroy {

    // Métadonnées
    titre = '';
    enonce = '';
    type: 'SQL' | 'BPMN' = 'SQL';

    // Correction
    dictionary: Field[] = [];
    dependencies: DependenceLine[] = [];
    mcd: Mcd = new Mcd([], [], []);
    technicalNames: string[] = [];

    isSaving = false;
    errorMessage = '';

    readonly SLUG = '__creation__';
    private readonly META_KEY = `create_meta_${this.SLUG}`;

    // Tailles des colonnes horizontales
    sizes = { enonce: 25, dictionnaire: 30, modelisation: 45 };
    previousSizes = { enonce: 25, dictionnaire: 30, modelisation: 45 };
    isCollapsed = {
        enonce: false, dictionnaire: false, modelisation: false,
        dictionnaireV: false, dependancesV: false
    };

    // Tailles du split vertical (colonne 2)
    sizesVertical = { dictionnaire: 50, dependances: 50 };
    previousSizesVertical = { dictionnaire: 50, dependances: 50 };

    readonly COLLAPSED_SIZE = 4;

    @ViewChild(McdEditorComponent) mcdEditor!: McdEditorComponent;
    @ViewChild('quillEditor') quillEditorRef!: ElementRef;

    private quillInstance: any;

    constructor(
        private exerciceService: ExerciceService,
        private dictionaryService: DictionaryService,
        private dependenceService: DependenceService,
        private mcdService: McdService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngAfterViewInit(): void {
        document.querySelectorAll('as-split-area, as-split').forEach(el => {
            el.removeAttribute('title');
        });

        // Init Quill
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
                this.quillInstance.on('text-change', () => {
                    this.enonce = this.quillInstance.root.innerHTML;
                });
            }
        }, 0);

        // Charger depuis localStorage
        const savedDict = this.dictionaryService.load(this.SLUG);
        if (savedDict?.length) {
            this.dictionary = savedDict;
            this.technicalNames = savedDict
                .map((f: Field) => f.TechnicalName)
                .filter((n: string) => n?.trim());
        }

        const savedDeps = this.dependenceService.loadDependences(this.SLUG);
        if (savedDeps?.length) this.dependencies = savedDeps;

        this.cdr.detectChanges();
    }
    private restoreFromStorage(): void {
        // Dictionnaire et dépendances
        this.dictionary = this.dictionaryService.load(this.SLUG);
        this.technicalNames = this.dictionary.map(f => f.TechnicalName).filter(n => n && n.trim() !== '');
        this.dependencies = this.dependenceService.loadDependences(this.SLUG);

        // Métadonnées (titre, type, énoncé)
        try {
            const raw = localStorage.getItem(this.META_KEY);
            if (raw) {
                const meta = JSON.parse(raw);
                if (meta.titre) this.titre = meta.titre;
                if (meta.type) this.type = meta.type;
                if (meta.enonce) {
                    this.enonce = meta.enonce;
                    this.quillInstance.root.innerHTML = meta.enonce;
                }
            } else if (this.quillInstance) {
                this.quillInstance.root.innerHTML = '';
            }
        } catch {
            // localStorage corrompu : on repart de zéro
        }
    }

    private saveMeta(): void {
        try {
            localStorage.setItem(this.META_KEY, JSON.stringify({
                titre: this.titre,
                type: this.type,
                enonce: this.enonce,
            }));
        } catch { /* quota dépassé : on ignore */ }
    }

    onTitreChange(): void { this.saveMeta(); }
    onTypeChange(): void { this.saveMeta(); }

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

    // --- Données ---

    onDictionaryChanged(updatedLines: Field[]): void {
        this.dictionary = updatedLines;
        this.technicalNames = updatedLines
            .map(f => f.TechnicalName)
            .filter(n => n && n.trim() !== '');
        this.dictionaryService.save(this.SLUG, this.dictionary);
    }

    onDependenciesChanged(event: DependenceLine[]): void {
        this.dependencies = event;
        this.dependenceService.saveDependences(this.SLUG, this.dependencies);
        this.cdr.detectChanges();
    }

    save(): void { }

    private getCurrentModel(): any {
        try {
            return this.mcdEditor?.mcd ?? {};
        } catch {
            return {};
        }
    }

    ngOnDestroy(): void {
        localStorage.removeItem(this.META_KEY);
        this.dictionaryService.save(this.SLUG, []);
        this.dependenceService.saveDependences(this.SLUG, []);
        this.mcdService.clearCache(this.SLUG);
    }

    onSave(): void {
        console.log('onSave() — titre:', this.titre);
        console.log('onSave() — enonce:', this.enonce);
        console.log('onSave() — getCurrentModel:', this.getCurrentModel());
        console.log('onSave() — mcdEditor:', this.mcdEditor);

        const htmlEnonce = this.quillInstance?.root.innerHTML ?? this.enonce;
        const plainEnonce = this.quillInstance?.getText().trim() ?? this.enonce.trim();

        if (!this.titre.trim() || !plainEnonce) {
            this.errorMessage = 'Le titre et l\'énoncé sont obligatoires.';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';

        let data: any;
        try {
            data = {
                titre: this.titre.trim(),
                enonce: htmlEnonce,
                type: this.type,
                etat: 'Non fini',
                dictionary: this.dictionary.filter(f => f.TechnicalName?.trim()),
                dependencies: this.dependencies.filter(d => d.source.length > 0 && d.cible.length > 0),
                model: this.getCurrentModel()
            };
        } catch (err) {
            console.error('onSave() — erreur lors de la construction du payload :', err);
            this.errorMessage = 'Erreur lors de la préparation des données.';
            this.isSaving = false;
            return;
        }

        console.log('onSave() — payload envoyé :', data);

        this.exerciceService.createExercice(data).subscribe({
            next: () => {
                this.isSaving = false;
                localStorage.removeItem(this.META_KEY);
                localStorage.removeItem('dict_data___creation__');
                localStorage.removeItem('dependences___creation__');
                localStorage.removeItem('mcd_cache___creation__');
                this.router.navigate(['/admin/exercices']);
            },
            error: (err) => {
                console.error('onSave() — erreur HTTP :', err);
                this.errorMessage = `Erreur lors de la création de l\'exercice (${err?.status ?? 'réseau'}).`;
                this.isSaving = false;
            }
        });
    }
}
