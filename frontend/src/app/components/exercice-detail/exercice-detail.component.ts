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
  mcd: Mcd = new Mcd();
  dictionary: Field[] = [];
  dependencies: DependenceLine[] = [];
  technicalNames: string[] = [];
  isLoaded: boolean = false;

  @ViewChild(McdEditorComponent) mcdEditor!: McdEditorComponent;

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:beforeunload')
  beforeUnloadHandler() { this.runSilentSave(); }

  ngOnDestroy(): void { this.runSilentSave(); }

  private runSilentSave() {
    if (this.exercice && this.isLoaded) {
      const data = {
        dictionary: this.dictionary,
        dependencies: this.dependencies,
        model: this.mcdEditor ? this.mcdEditor.mcd : this.mcd
      };
      console.log('💾 [AUTO-SAVE] Envoi des données...', data);
      this.exerciceService.emergencySave(this.exercice.id, data);
    }
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe((response: any) => {
        this.exercice = response.data || response;
        if (this.exercice?.id) {
          this.exerciceService.getLastAttempt(this.exercice.id).subscribe((res: any) => {
            if (res && res.data) {
              const attempt = res.data;
              console.log('📥 [LOAD] Réception BD :', attempt);

              // DEBUG : voir la structure exacte du premier élément
              if (attempt.dictionary && attempt.dictionary.length > 0) {
                console.log('🔍 Premier élément brut :', attempt.dictionary[0]);
                console.log('🔍 Clés disponibles :', Object.keys(attempt.dictionary[0]));
              }

              // Reconstruction des objets Field depuis le JSON
              this.dictionary = attempt.dictionary
                ? attempt.dictionary.map((f: any) => Field.fromJSON(f))
                : [];

              console.log('📖 Dictionary après fromJSON :', this.dictionary);

              // Reconstruction des objets DependenceLine depuis le JSON
              this.dependencies = attempt.dependencies
                ? attempt.dependencies.map((d: any) => DependenceLine.fromJSON(d))
                : [];

              if (attempt.model) this.mcd = Mcd.fromJSON(attempt.model);

              this.updateTechnicalNames();
              this.cdr.detectChanges();

              setTimeout(() => {
                this.isLoaded = true;
                console.log('🔓 [LOAD] Verrou levé. Sauvegarde autorisée.');
              }, 500);
            } else {
              this.isLoaded = true;
            }
          });
        }
      });
    }
  }

  onDictionaryChanged(event: Field[]) {
    this.dictionary = event;
    this.updateTechnicalNames();
  }

  onDependenciesChanged(event: DependenceLine[]) {
    this.dependencies = event;
  }

  updateTechnicalNames() {
    this.technicalNames = this.dictionary
      .map(l => l.TechnicalName)
      .filter(n => n && n.trim() !== '');
  }

  save(): Observable<any> {
    if (!this.exercice || !this.isLoaded) return of(null);
    const data = {
      dictionary: this.dictionary,
      dependencies: this.dependencies,
      model: this.mcdEditor ? this.mcdEditor.mcd : this.mcd
    };
    return this.exerciceService.saveAttempt(this.exercice.id, data);
  }
}