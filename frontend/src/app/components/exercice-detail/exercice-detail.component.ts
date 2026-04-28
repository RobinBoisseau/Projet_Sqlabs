import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';

// Moteur de rendu et Plugin de sélection (v2)
import { Graph } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';

// Services et Modèles
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';

// Composants partagés
import { PanelComponent } from '../panel/panel.component';
import { AddButtonComponent } from '../add-button/add-button.component';
import { ToolButtonComponent } from '../toll-button/toll-button.component';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AngularSplitModule, 
    PanelComponent, 
    AddButtonComponent, 
    ToolButtonComponent
  ],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit, OnDestroy {
  exercice: Exercice | undefined;
  
  // Tableaux pour les formulaires de la colonne 2
  attributes: any[] = [];
  dependances: any[] = [];

  // Instance du graphe
  private graph?: Graph;

  constructor(
    private route: ActivatedRoute,
    private exerciceService: ExerciceService
  ) {}

  // --- LOGIQUE DE SUPPRESSION (TOUCHE CLAVIER) ---
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Si on appuie sur Suppr ou Backspace et qu'un élément est sélectionné
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.graph) {
      const cells = this.graph.getSelectedCells();
      if (cells.length > 0) {
        this.graph.removeCells(cells);
        console.log(`${cells.length} élément(s) supprimé(s)`);
      }
    }
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (data) => {
          this.exercice = data;
          // On attend que le HTML soit rendu pour initialiser le graphe
          setTimeout(() => {
            this.initGraph();
          }, 100);
        },
        error: (err) => console.error('Erreur lors de la récupération de l\'exercice', err)
      });
    }
  }

  // --- INITIALISATION DU GRAPHE ANTV X6 (VERSION 2) ---
  initGraph() {
    const container = document.getElementById('container');
    if (!container) {
      console.error("Le container #container est introuvable");
      return;
    }

    // 1. Création du graphe
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

    // 2. Activation du plugin de SÉLECTION (Nécessaire en v2 pour getSelectedCells)
    this.graph.use(
      new Selection({
        enabled: true,
        multiple: true,      // Permet de sélectionner plusieurs éléments (Maj + clic)
        rubberband: true,    // Permet de sélectionner par zone (lasso)
        showNodeSelectionBox: true, // Affiche le cadre bleu de sélection
      })
    );

    console.log("AntV X6 v2 initialisé avec succès");
  }

  // --- FONCTIONS DE DESSIN ---

  addEntity() {
    this.graph?.addNode({
      shape: 'rect',
      x: 100, y: 100,
      width: 120, height: 60,
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
      x: 150, y: 150,
      width: 90, height: 45,
      label: 'attribut',
      attrs: {
        body: { fill: '#fff', stroke: '#1a73e8', strokeWidth: 1.5 }
      }
    });
  }

  addRelation() {
    this.graph?.addNode({
      shape: 'polygon',
      x: 200, y: 100,
      width: 100, height: 50,
      label: 'RELATION',
      points: '0,25 50,0 100,25 50,50', // Forme losange
      attrs: {
        body: { fill: '#fff', stroke: '#e67e22', strokeWidth: 2 }
      }
    });
  }

  ngOnDestroy(): void {
    // Nettoyage de la mémoire quand on quitte le composant
    this.graph?.dispose();
  }

  // --- LOGIQUE DICTIONNAIRE ET DÉPENDANCES ---
  addAttribute() { this.attributes.push({ nom: '', type: 'INT' }); }
  removeAttribute(index: number) { this.attributes.splice(index, 1); }
  addDependance() { this.dependances.push({ gauche: '', droite: '' }); }
  removeDependance(index: number) { this.dependances.splice(index, 1); }
}