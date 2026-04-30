import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { Mcd } from '../../models/mcd';
import { PanelComponent } from '../panel/panel.component';
import { DictionaryTableComponent } from '../dictionary-table/dictionary-table.component';
import { DependenceTableComponent } from '../dependence-table/dependence-table.component';
import { McdEditorComponent } from '../mcd-editor/mcd-editor.component';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [CommonModule, AngularSplitModule, DragDropModule, PanelComponent, DictionaryTableComponent, DependenceTableComponent, McdEditorComponent],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit {
  exercice: Exercice | undefined;
  mcd: Mcd | undefined; 

  constructor(private route: ActivatedRoute, private exerciceService: ExerciceService) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (res: any) => {
          this.exercice = res.data ? res.data : res;
          let raw = (this.exercice as any).mcd_json;
          if (typeof raw === 'string' && raw !== "") raw = JSON.parse(raw);
          this.mcd = Mcd.fromJSON(raw || { Entities: [], Association: [] });
        }
      });
    }
  }

  sauvegarder() {
    if (this.exercice && this.mcd) {
      this.exerciceService.saveExerciceProgress(this.exercice.slug, JSON.stringify(this.mcd)).subscribe({
        next: () => alert("Tableaux et Schéma sauvegardés !"),
        error: (err) => console.error("Erreur save", err)
      });
    }
  }
}