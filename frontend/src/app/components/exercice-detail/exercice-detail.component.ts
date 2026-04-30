import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AngularSplitModule } from 'angular-split';
import { DragDropModule } from '@angular/cdk/drag-drop';

// AntV X6
import { Graph, Node } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Dnd } from '@antv/x6-plugin-dnd';

// Services et Modèles
import { ExerciceService } from '../../services/exercice.service';
import { Exercice } from '../../models/exercice';
import { Mcd } from '../../models/mcd';
import { Champs } from '../../models/champs';

// Composants partagés
import { PanelComponent } from '../panel/panel.component';
import { ToolButtonComponent } from '../toll-button/toll-button.component';
import { DependenceTableComponent } from '../dependence-table/dependence-table.component';
import { DictionaryTableComponent } from '../dictionary-table/dictionary-table.component';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, AngularSplitModule, DragDropModule,
    PanelComponent, ToolButtonComponent, DictionaryTableComponent, DependenceTableComponent,
  ],
  templateUrl: './exercice-detail.component.html',
  styleUrls: ['./exercice-detail.component.css']
})
export class ExerciceDetailComponent implements OnInit, OnDestroy {
  exercice: Exercice | undefined;
  mcd: Mcd | undefined; 
  private graph?: Graph;
  private dnd?: Dnd;

  constructor(private route: ActivatedRoute, private exerciceService: ExerciceService) {}

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.graph) {
      const cells = this.graph.getSelectedCells();
      if (cells.length > 0) this.graph.removeCells(cells);
    }
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.exerciceService.getExerciceBySlug(slug).subscribe({
        next: (response: any) => {
          this.exercice = response.data ? response.data : response;
          let rawMcd = (this.exercice as any).mcd_json;
          if (typeof rawMcd === 'string' && rawMcd !== "") {
            try { rawMcd = JSON.parse(rawMcd); } catch (e) { rawMcd = null; }
          }
          this.mcd = Mcd.fromJSON(rawMcd || { Entities: [], Association: [] });
          setTimeout(() => { 
            this.initGraph(); 
            this.drawMcd(); 
          }, 200);
        }
      });
    }
  }

  initGraph() {
    const container = document.getElementById('container');
    if (!container) return;

    this.graph = new Graph({
      container: container,
      autoResize: true,
      grid: { size: 20, visible: true, type: 'dot', args: { color: '#d7d7d7', thickness: 1 } },
      panning: true,
      mousewheel: { enabled: true, modifiers: ['ctrl'] },
    });

    // Enregistrement du modèle Merise
    Graph.registerNode('merise-entity', {
      inherit: 'rect',
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'header' },
        { tagName: 'text', selector: 'label' },
        { tagName: 'line', selector: 'divider' },
        { tagName: 'circle', selector: 'addButton' },
        { tagName: 'text', selector: 'plusSign' }
      ],
      attrs: {
        body: { fill: '#ffffff', stroke: '#334155', strokeWidth: 2, rx: 8, ry: 8 },
        header: { fill: '#334155', stroke: '#334155', strokeWidth: 2, height: 30, refWidth: '100%', rx: 8, ry: 8 },
        label: { textAnchor: 'middle', refX: '50%', refY: 15, fill: '#ffffff', fontSize: 14, fontWeight: 'bold' },
        divider: { stroke: '#334155', strokeWidth: 1, x1: 0, refY: 30, refX2: '100%' },
        addButton: {
          r: 10, refX: '100%', refX2: -15, refY: '100%', refY2: -15,
          fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 1, cursor: 'pointer',
          event: 'node:add-field'
        },
        plusSign: {
          text: '+', refX: '100%', refX2: -15, refY: '100%', refY2: -15,
          fill: '#ffffff', fontSize: 16, fontWeight: 'bold', textAnchor: 'middle', textVerticalAnchor: 'middle',
          pointerEvents: 'none'
        }
      }
    });

    // Correction de l'erreur TypeScript ici :
    this.graph.on('node:add-field', ({ node }: { node: Node }) => {
      this.ajouterChampAuNoeud(node);
    });

    this.graph.use(new Selection({ enabled: true, multiple: true, rubberband: true, showNodeSelectionBox: true }));
    this.dnd = new Dnd({ target: this.graph, scaled: false });
  }

  ajouterChampAuNoeud(node: Node) {
    const data = node.getData() as any;
    if (data && data.fields) {
      const nouveauChamp = new Champs(Date.now(), "Nouveau_Champ", "VARCHAR2", false);
      data.fields.push(nouveauChamp);
      const currentSize = node.getSize();
      node.resize(currentSize.width, currentSize.height + 25);
    }
  }

  drawMcd() {
    if (!this.graph || !this.mcd) return;
    this.mcd.Entities.forEach(entite => {
      this.graph?.addNode({
        id: entite.id.toString(),
        shape: 'merise-entity',
        x: entite.x, y: entite.y,
        width: entite.largeur || 140, height: entite.hauteur || 100,
        label: entite.name,
        data: entite
      });
    });
  }

  sauvegarder() {
    if (!this.graph || !this.mcd || !this.exercice) return;
    const nodes = this.graph.getNodes();
    nodes.forEach(node => {
      const pos = node.getPosition();
      const size = node.getSize();
      const entityData = this.mcd?.Entities.find(e => e.id.toString() === node.id);
      if (entityData) {
        entityData.x = pos.x; entityData.y = pos.y;
        entityData.largeur = size.width; entityData.hauteur = size.height;
      }
    });
    this.exerciceService.saveExerciceProgress(this.exercice.slug, JSON.stringify(this.mcd)).subscribe({
      next: () => alert("Schéma sauvegardé !"),
      error: (err) => console.error("Erreur sauvegarde", err)
    });
  }

  startDrag(event: MouseEvent, type: 'entity' | 'association') {
    if (!this.graph || !this.dnd) return;
    let node;
    if (type === 'entity') {
      node = this.graph.createNode({ shape: 'merise-entity', width: 140, height: 100, label: 'ENTITÉ' });
    } else {
      node = this.graph.createNode({ 
        shape: 'ellipse', width: 100, height: 60, label: 'ASSOCIATION',
        attrs: { body: { fill: '#fff', stroke: '#e67e22', strokeWidth: 2 }, label: { text: 'ASSOCIATION', fontWeight: 'bold' } }
      });
    }
    if (node) this.dnd.start(node, event);
  }

  ngOnDestroy(): void {
    this.graph?.dispose();
  }
}