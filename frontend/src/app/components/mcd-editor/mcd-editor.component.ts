import { Component, OnInit, OnDestroy, HostListener, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Graph, Node } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Mcd } from '../../models/mcd';
import { Champs } from '../../models/champs';
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
  
  @Input() mcd: Mcd | undefined;
  @Output() saveRequested = new EventEmitter<void>();

  private graph?: Graph;
  private dnd?: Dnd;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.graph) {
      const cells = this.graph.getSelectedCells();
      if (cells.length > 0) this.graph.removeCells(cells);
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.initGraph();
      if (this.mcd) this.drawMcd();
    }, 500);
  }

  initGraph() {
    this.graph = new Graph({
      container: this.containerRef.nativeElement,
      autoResize: true,
      grid: { size: 20, visible: true, type: 'dot', args: { color: '#d7d7d7', thickness: 1 } },
      panning: true,
      mousewheel: { enabled: true, modifiers: ['ctrl'] },
      interacting: { nodeMovable: true, edgeMovable: true },
    });

    // Enregistrement Merise
    Graph.registerNode('merise-entity', {
      inherit: 'rect',
      markup: [{ tagName: 'rect', selector: 'body' }, { tagName: 'rect', selector: 'header' }, { tagName: 'text', selector: 'label' }, { tagName: 'line', selector: 'divider' }, { tagName: 'circle', selector: 'addButton' }, { tagName: 'text', selector: 'plusSign' }],
      attrs: {
        body: { fill: '#ffffff', stroke: '#334155', strokeWidth: 2, rx: 8, ry: 8 },
        header: { fill: '#334155', height: 30, refWidth: '100%', rx: 8, ry: 8 },
        label: { textAnchor: 'middle', refX: '50%', refY: 15, fill: '#ffffff', fontSize: 14, fontWeight: 'bold' },
        divider: { stroke: '#334155', strokeWidth: 1, x1: 0, refY: 30, refX2: '100%' },
        addButton: { r: 10, refX: '100%', refX2: -15, refY: '100%', refY2: -15, fill: '#3b82f6', cursor: 'pointer', event: 'node:add-field' },
        plusSign: { text: '+', refX: '100%', refX2: -15, refY: '100%', refY2: -15, fill: '#ffffff', fontSize: 16, fontWeight: 'bold', textAnchor: 'middle', textVerticalAnchor: 'middle', pointerEvents: 'none' }
      }
    });

    this.graph.on('node:add-field', ({ node }: { node: Node }) => {
      const data = node.getData() as any;
      if (data && data.fields) {
        data.fields.push(new Champs(Date.now(), "Nouveau_Champ", "VARCHAR2", false));
        const size = node.getSize();
        node.resize(size.width, size.height + 25);
      }
    });

    this.graph.use(new Selection({ enabled: true, multiple: true, rubberband: true, showNodeSelectionBox: true }));
    
    // CONFIGURATION DND ULTIME
    this.dnd = new Dnd({ 
      target: this.graph, 
      scaled: false,
      validateNode: () => true 
    });
  }

  drawMcd() {
    if (!this.graph || !this.mcd) return;
    this.graph.clearCells();
    this.mcd.Entities.forEach(entite => {
      this.graph?.addNode({ id: entite.id.toString(), shape: 'merise-entity', member_x: entite.member_x, y: entite.member_y, width: entite.width, height: entite.height, label: entite.name, data: entite });
    });
  }

  startDrag(event: MouseEvent, type: 'entity' | 'association') {
    if (!this.graph || !this.dnd) return;
    const node = type === 'entity' 
      ? this.graph.createNode({ shape: 'merise-entity', width: 140, height: 100, label: 'ENTITÉ' })
      : this.graph.createNode({ shape: 'ellipse', width: 120, height: 60, label: 'ASSOCIATION', attrs: { body: { fill: '#fff', stroke: '#e67e22', strokeWidth: 2 }, label: { text: 'ASSOCIATION', fontWeight: 'bold' } } });
    
    this.dnd.start(node, event);
  }

  triggerSave() {
    if (this.graph && this.mcd) {
      this.graph.getNodes().forEach(node => {
        const entity = this.mcd?.Entities.find(e => e.id.toString() === node.id);
        if (entity) {
          const pos = node.getPosition();
          const size = node.getSize();
          entity.member_x = pos.x; entity.member_y = pos.y;
          entity.width = size.width; entity.height = size.height;
        }
      });
      this.saveRequested.emit();
    }
  }

  ngOnDestroy(): void { this.graph?.dispose(); }
}