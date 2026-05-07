import { Component, OnInit, OnDestroy, HostListener, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Graph, Node, Edge, Path } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Transform } from '@antv/x6-plugin-transform'; // Pour redimensionner

import { Mcd } from '../../models/mcd';
import { Entity } from '../../models/entity';
import { Association } from '../../models/association';
import { Link } from '../../models/link';
import { Field } from '../../models/field';
import { McdService } from '../../services/mcd.service';
import { ToolButtonComponent } from '../toll-button/toll-button.component';

@Component({
  selector: 'app-mcd-editor',
  standalone: true,
  imports: [CommonModule, ToolButtonComponent],
  templateUrl: './mcd-editor.component.html',
  styleUrls: ['./mcd-editor.component.css']
})
export class McdEditorComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef;
  @Input() slug: string = '';
  @Input() mcd: Mcd | undefined;

  private graph?: Graph;
  private dnd?: Dnd;

  constructor(private mcdService: McdService) { }

  ngOnInit(): void {
    // On charge d'abord les données
    const savedMcd = this.mcdService.loadMcd(this.slug);
    if (savedMcd) this.mcd = savedMcd;

    setTimeout(() => {
      this.initGraph();
      if (this.mcd) this.drawMcd();
    }, 100);
  }

  initGraph() {
    this.graph = new Graph({
      container: this.containerRef.nativeElement,
      autoResize: true,
      grid: { size: 10, visible: true, type: 'mesh', args: { color: '#e2e8f0', thickness: 1 } },
      panning: true,
      mousewheel: { enabled: true, modifiers: ['ctrl'] },
      connecting: {
        snap: { radius: 20 },
        allowBlank: false,
        allowLoop: false,
        highlight: true,
        router: 'manhattan',
        connector: 'rounded',
        validateConnection({ sourceView, targetView }) {
          if (!sourceView || !targetView) return false;

          const sourceNode = sourceView.cell as Node;
          const targetNode = targetView.cell as Node;

          if (!sourceNode.isNode() || !targetNode.isNode()) return false;

          const sourceShape = sourceNode.shape;
          const targetShape = targetNode.shape;

          // Association → Entité OU Entité → Association
          return (
            (sourceShape === 'ellipse' && targetShape === 'merise-entity') ||
            (sourceShape === 'merise-entity' && targetShape === 'ellipse')
          );
        },
        createEdge() {
          return this.createEdge({
            shape: 'edge',
            attrs: { line: { stroke: '#334155', strokeWidth: 2, targetMarker: null } },
            zIndex: 0
          });
        }
      }
    })

    // Plugins
    this.graph.use(new Selection({ enabled: true, rubberband: true, showNodeSelectionBox: true }));

    this.graph.use(new Transform({
      resizing: {
        enabled: true,
        orthogonal: false,
        restrict: false,
        preserveAspectRatio: false,
      },
      rotating: false,
    }));

    // --- ENREGISTREMENT DES FORMES AVEC PORTS ---
    Graph.registerNode('merise-entity', {
      inherit: 'rect',
      markup: [{ tagName: 'rect', selector: 'body' }, { tagName: 'rect', selector: 'header' }, { tagName: 'text', selector: 'label' }, { tagName: 'text', selector: 'fields' }],
      attrs: {
        body: { fill: '#ffffff', stroke: '#1e293b', strokeWidth: 2, rx: 4, ry: 4, magnet: true },
        header: { fill: '#1e293b', height: 25, refWidth: '100%', rx: 4, ry: 4 },
        label: { textAnchor: 'middle', refX: '50%', refY: 12, fill: '#ffffff', fontSize: 12, fontWeight: 'bold' },
        fields: { refX: 8, refY: 35, fontSize: 11, fill: '#334155' }
      }
    }, true);

    // --- EVENEMENTS DE SAUVEGARDE (Fix le problème du coin en haut à gauche) ---
    const updateData = ({ node }: { node: Node }) => {
      const data = node.getData();
      if (data) {
        const pos = node.getPosition();   // ← getPosition() et non position()
        const size = node.getSize();      // ← getSize() et non size()
        data.posX = pos.x;
        data.posY = pos.y;
        data.width = size.width;
        data.height = size.height;
        this.autoSave();
      }
    };

    this.graph.on('node:change:position', updateData);
    this.graph.on('node:resized', updateData);

    // Édition Cardinalité au double clic sur le lien
    this.graph.on('edge:dblclick', ({ edge }) => {
      const data = edge.getData();
      const newCard = prompt('Modifier la cardinalité :', data?.cardinality || '1,N');
      if (newCard !== null) {
        if (data) data.cardinality = newCard;
        edge.setLabels([{ attrs: { text: { text: newCard } } }]);
        this.autoSave();
      }
    });

    this.graph.on('edge:connected', ({ edge }) => {
      const source = edge.getSourceNode();
      const target = edge.getTargetNode();
      if (source && target && this.mcd) {
        const card = prompt('Cardinalité :', '1,N') || '1,N';
        const link = new Link(card);
        // On identifie qui est l'asso et qui est l'entité
        const sourceData = source.getData();
        const targetData = target.getData();

        link.anchoringAssoc = source.shape === 'ellipse' ? sourceData : targetData;
        link.anchoringEntity = source.shape === 'merise-entity' ? sourceData : targetData;

        this.mcd.Links.push(link);
        edge.setData(link);
        edge.setLabels([{ attrs: { text: { text: card } } }]);
        this.autoSave();
      }
    });

    this.dnd = new Dnd({ target: this.graph });
  }

  drawMcd() {
    if (!this.graph || !this.mcd) return;
    this.graph.clearCells();

    this.mcd.Entities.forEach(e => {
      this.graph!.addNode({
        shape: 'merise-entity',
        x: e.posX ?? 0,
        y: e.posY ?? 0,
        width: e.width ?? 120,
        height: e.height ?? 80,
        data: e,
        attrs: { label: { text: e.name } }
      });
    });

    this.mcd.Associations.forEach(a => {
      this.graph!.addNode({
        shape: 'ellipse',
        x: a.posX ?? 0,
        y: a.posY ?? 0,
        width: a.width ?? 80,
        height: a.height ?? 50,
        label: a.name,
        data: a,
        attrs: { body: { fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 2, magnet: true } }
      });
    });

    this.mcd.Links.forEach(l => {
      const sourceNode = this.graph?.getNodes().find(n => n.getData() === l.anchoringAssoc);
      const targetNode = this.graph?.getNodes().find(n => n.getData() === l.anchoringEntity);
      if (sourceNode && targetNode) {
        this.graph!.addEdge({
          source: sourceNode, target: targetNode,
          labels: [{ attrs: { text: { text: l.cardinality } } }],
          data: l
        });
      }
    });
  }
  
  triggerSave() {
    this.autoSave();
  }

  private autoSave() {
    if (this.mcd && this.slug) {
      console.log("Saving MCD position and sizes...", this.mcd);
      this.mcdService.saveMcd(this.slug, this.mcd);
    }
  }


  startDrag(event: MouseEvent, type: 'entity' | 'association') {
    if (!this.graph || !this.dnd) return;

    let newNode;
    const suffix = Math.floor(Math.random() * 1000);

    if (type === 'entity') {
      const ent = new Entity('ENTITE_' + suffix, [], 0, 0, 120, 80);
      this.mcd?.Entities.push(ent);
      newNode = this.graph.createNode({ shape: 'merise-entity', width: 120, height: 80, data: ent, attrs: { label: { text: ent.name } } });
    } else {
      const asc = new Association('ASSOC_' + suffix, [], 0, 0, 80, 50);
      this.mcd?.Associations.push(asc);
      newNode = this.graph.createNode({ shape: 'ellipse', width: 80, height: 50, label: asc.name, data: asc, attrs: { body: { fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 2, magnet: true } } });
    }
    this.dnd.start(newNode, event);
  }

  ngOnDestroy(): void {
    this.graph?.dispose();
  }
}