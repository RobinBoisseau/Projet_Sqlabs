import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { DragDropModule } from '@angular/cdk/drag-drop'; // INDISPENSABLE pour le cdkDropListGroup

// Moteur de rendu et Plugin de sélection (v2)
import { Graph } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';

// Services et Modèles
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { Entities } from '../../models/entities';
import { Champs } from '../../models/champs';

// Composants partagés
import { PanelComponent } from '../panel/panel.component';
import { AddButtonComponent } from '../add-button/add-button.component';
import { ToolButtonComponent } from '../toll-button/toll-button.component';
import { DependenceTableComponent } from '../dependence-table/dependence-table.component';
import { DictionaryTableComponent } from '../dictionary-table/dictionary-table.component';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AngularSplitModule, 
    DragDropModule, // Ajouté pour permettre le drag entre les panneaux du split
    PanelComponent, 
    AddButtonComponent, 
    ToolButtonComponent,
    DictionaryTableComponent,
    DependenceTableComponent,
  ],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit, OnDestroy {
  exercice: Exercice | undefined;
  
  // Instance du graphe AntV X6
  private graph?: Graph;

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService
  ) {}

  // --- LOGIQUE DE SUPPRESSION GRAPHique (TOUCHE CLAVIER) ---
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.graph) {
      const cells = this.graph.getSelectedCells();
      if (cells.length > 0) {
        this.graph.removeCells(cells);
        console.log(`${cells.length} élément(s) supprimé(s) du schéma`);
      }
    }
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (data) => {
          this.exercice = data;
          // On attend un micro-délai pour que le DOM soit prêt
          setTimeout(() => {
            this.initGraph();
          }, 100);
        },
        error: (err) => console.error('Erreur lors de la récupération de l\'exercice', err)
      });
    }
    // Petit test console pour vérifier tes classes
    this.testerExportEntite(); 
  }

  // --- INITIALISATION DU GRAPHE ANTV X6 ---
  initGraph() {
    const container = document.getElementById('container');
    if (!container) return;

    this.graph = new Graph({
      container: container,
      autoResize: true,
      grid: {
        size: 20,
        visible: true,
        type: 'dot',
        args: { color: '#d7d7d7', thickness: 1 },
      },
      panning: true,
      mousewheel: { enabled: true, modifiers: ['ctrl'] },
    });

    // Activation de la sélection v2
    this.graph.use(
      new Selection({
        enabled: true,
        multiple: true,
        rubberband: true,
        showNodeSelectionBox: true,
      })
    );
  }

  // --- ACTIONS DU PANEL DE MODÉLISATION ---
  addEntity() {
    this.graph?.addNode({
      shape: 'rect',
      x: 100, y: 100, width: 120, height: 60,
      label: 'ENTITÉ',
      attrs: {
        body: { fill: '#fff', stroke: '#34495e', strokeWidth: 2 },
        label: { text: 'ENTITÉ', fill: '#333', fontWeight: 'bold' }
      }
    });
  }

  addAttributeToSchema() {
    this.graph?.addNode({
      shape: 'ellipse',
      x: 150, y: 150, width: 90, height: 45,
      label: 'attribut',
      attrs: {
        body: { fill: '#fff', stroke: '#1a73e8', strokeWidth: 1.5 }
      }
    });
  }

  addRelation() {
    this.graph?.addNode({
      shape: 'polygon',
      x: 200, y: 100, width: 100, height: 50,
      label: 'RELATION',
      points: '0,25 50,0 100,25 50,50',
      attrs: {
        body: { fill: '#fff', stroke: '#e67e22', strokeWidth: 2 }
      }
    });
  }

  ngOnDestroy(): void {
    this.graph?.dispose();
  }

  // --- TEST DE SÉRIALISATION JSON ---
  testerExportEntite() {
    const champ1 = new Champs(1, "id_client", "INT", true);
    const champ2 = new Champs(2, "nom_client", "VARCHAR", false);

    const nouvelleEntite = new Entities(
        101, "Client", 150, 50, 50, [champ1, champ2]
    );

    console.log("Objet JS métier :", nouvelleEntite);
    console.log("JSON exportable :", JSON.stringify(nouvelleEntite));
  }
}