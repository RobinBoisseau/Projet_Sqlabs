import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Graph } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Dnd } from '@antv/x6-plugin-dnd';

// Tes Modèles (vérifie bien que les fichiers existent dans ton dossier models)
import { Entities } from '../../models/entities';
import { Association } from '../../models/associations';

@Component({
  selector: 'app-mcd-editor',
  standalone: true,
  imports: [CommonModule],
  template: `<div #container class="graph-container"></div>`,
  styles: [`
    .graph-container {
      width: 100%;
      height: 600px; 
      background-color: #f8f9fa;
      border: 2px solid #3498db;
      cursor: crosshair;
    }
  `]
})
export class McdEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef;
  private graph?: Graph;
  private dnd?: Dnd;

  ngAfterViewInit() {
    this.initGraph();
  }

  private initGraph() {
    // 1. Enregistrement du Noeud Merise
    Graph.registerNode('merise-association', {
      inherit: 'rect',
      width: 100, height: 60,
      attrs: {
        body: { rx: 30, ry: 30, fill: '#2ecc71', stroke: '#27ae60', strokeWidth: 2 },
        line: { x1: 0, y1: 30, x2: 100, y2: 30, stroke: '#27ae60', strokeWidth: 2 },
        label: { text: 'ASSOC', refY: 15, fill: '#fff', fontWeight: 'bold', fontSize: 10 },
        fields: { text: 'valeurs', refY: 45, fill: '#fff', fontSize: 9, refX: 0.5, textAnchor: 'middle' }
      },
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'line', selector: 'line' },
        { tagName: 'text', selector: 'label' },
        { tagName: 'text', selector: 'fields' }
      ],
    });

    // 2. Création du Graphe
    this.graph = new Graph({
      container: this.containerRef.nativeElement,
      autoResize: true,
      panning: true,
      grid: { size: 10, visible: true },
      mousewheel: { enabled: true, modifiers: ['ctrl'] },
    });

    this.graph.use(new Selection({ enabled: true, rubberband: true, showNodeSelectionBox: true }));
    this.dnd = new Dnd({ target: this.graph, scaled: true });

    // Événement Double Clic pour renommer
    this.graph.on('node:dblclick', ({ node }) => {
      const oldName = node.attr('label/text') as string;
      const newName = prompt('Nouveau nom :', oldName);
      if (newName) {
        node.attr('label/text', newName.toUpperCase());
        const data = node.getData() as any;
        if (data) {
          data.name = newName;
          node.setData(data);
        }
      }
    });
  }

  // --- LES MÉTHODES PUBLIQUES (BIEN À L'INTÉRIEUR DE LA CLASSE) ---

  public startDrag(event: MouseEvent, type: 'entity' | 'association') {
    if (!this.graph || !this.dnd) return;

    let node;
    if (type === 'entity') {
      const data = new Entities(Date.now(), "ENTITÉ", 150, 0, 0, []);
      node = this.graph.createNode({
        shape: 'rect', width: 120, height: 50,
        data: data,
        attrs: {
          body: { fill: '#fff', stroke: '#34495e', strokeWidth: 2 },
          label: { text: 'ENTITÉ' }
        }
      });
    } else {
      const data = new Association(Date.now(), "ASSOCIER", [], []);
      node = this.graph.createNode({
        shape: 'merise-association',
        data: data
      });
    }

    this.dnd.start(node, event);
  }

  public exportMcdToJson() {
    const nodes = this.graph?.getNodes() || [];
    const dataExport = {
      entities: nodes.filter((n: any) => n.shape === 'rect').map((n: any) => n.getData()),
      associations: nodes.filter((n: any) => n.shape === 'merise-association').map((n: any) => n.getData())
    };
    return JSON.stringify(dataExport);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.graph) {
      const cells = this.graph.getSelectedCells();
      this.graph.removeCells(cells);
    }
  }

  ngOnDestroy() {
    this.graph?.dispose();
  }
} // <--- LA SEULE ET UNIQUE ACCOLADE DE FIN DE CLASSE