import { Injectable } from '@angular/core';
import { Graph, Node } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Transform } from '@antv/x6-plugin-transform';

const ENTITY_PORTS = {
  groups: {
    top:    { position: 'top',    attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
    bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
    left:   { position: 'left',   attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
    right:  { position: 'right',  attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
  },
  items: [{ group: 'top' }, { group: 'bottom' }, { group: 'left' }, { group: 'right' }],
};

const ASSOC_PORTS = {
  groups: {
    top:    { position: 'top',    attrs: { circle: { r: 6, magnet: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5, style: { visibility: 'hidden' } } } },
    bottom: { position: 'bottom', attrs: { circle: { r: 6, magnet: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5, style: { visibility: 'hidden' } } } },
    left:   { position: 'left',   attrs: { circle: { r: 6, magnet: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5, style: { visibility: 'hidden' } } } },
    right:  { position: 'right',  attrs: { circle: { r: 6, magnet: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5, style: { visibility: 'hidden' } } } },
  },
  items: [{ group: 'top' }, { group: 'bottom' }, { group: 'left' }, { group: 'right' }],
};

@Injectable()
export class McdGraphService {
  private _graph?: Graph;
  private _dnd?: Dnd;

  get graph(): Graph | undefined { return this._graph; }
  get dnd(): Dnd | undefined { return this._dnd; }

  initGraph(container: HTMLElement): Graph {
    this._graph = new Graph({
      container,
      autoResize: true,
      grid: { size: 10, visible: true, type: 'mesh', args: { color: '#e2e8f0', thickness: 1 } },
      panning: { enabled: true, modifiers: ['space'] },
      mousewheel: { enabled: true, modifiers: ['ctrl'] },
      highlighting: {
        magnetAvailable: { name: 'className', args: { className: 'port-disponible' } },
        magnetAdsorbed:  { name: 'className', args: { className: 'port-aimante' } },
      },
      connecting: {
        snap: { radius: 30 },
        allowBlank: false,
        allowLoop: false,
        allowMulti: true,
        highlight: true,
        router: 'manhattan',
        connector: { name: 'rounded', args: { radius: 8 } },
        validateConnection({ sourceView, targetView }) {
          const src = sourceView?.cell as any;
          const tgt = targetView?.cell as any;
          if (!src?.isNode?.() || !tgt?.isNode?.()) return false;
          return src.shape === 'merise-assoc' && tgt.shape === 'merise-entity';
        },
        createEdge() {
          return this.createEdge({
            shape: 'edge',
            attrs: { line: { stroke: '#334155', strokeWidth: 2, targetMarker: '', sourceMarker: '' } },
            zIndex: 0,
          });
        },
      },
    });

    this._graph.use(new Selection({
      enabled: true,
      rubberband: true,
      modifiers: ['shift'],
      showNodeSelectionBox: false,
      pointerEvents: 'none',
    }));

    this._graph.use(new Transform({
      resizing: {
        enabled: (node: Node) => node.shape !== 'merise-assoc',
        orthogonal: true,
        restrict: false,
        preserveAspectRatio: false,
        minWidth: 80,
        minHeight: 40,
      },
      rotating: false,
    }));

    this._dnd = new Dnd({
      target: this._graph,
      scaled: false,
      getDragNode: (node) => node.clone(),
      getDropNode: (node) => node.clone(),
    });

    return this._graph;
  }

  registerNodeShapes(): void {
    Graph.registerNode('merise-entity', {
      inherit: 'rect',
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'header' },
        { tagName: 'path', selector: 'field-separators' },
        { tagName: 'text', selector: 'label' },
        { tagName: 'text', selector: 'fields-text' },
      ],
      attrs: {
        body:   { refWidth: '100%', refHeight: '100%', fill: '#ffffff', stroke: '#0061d5', strokeWidth: 2, rx: 8, ry: 8 },
        header: { refWidth: '100%', height: 28, fill: '#0061d5', rx: 8, ry: 8, stroke: 'none' },
        label:  { refX: '50%', refY: 14, textAnchor: 'middle', fill: '#ffffff', fontSize: 12, fontWeight: 'bold' },
        'fields-text': {
          refX: 8, refY: 35,
          fill: '#334155', fontSize: 11,
          textAnchor: 'start', textVerticalAnchor: 'top',
          whiteSpace: 'pre', cursor: 'pointer', pointerEvents: 'auto', refWidth: '100%',
        },
      },
      ports: { ...ENTITY_PORTS },
    }, true);

    Graph.registerNode('merise-assoc', {
      inherit: 'ellipse',
      markup: [
        { tagName: 'ellipse', selector: 'body' },
        { tagName: 'line',    selector: 'separator' },
        { tagName: 'text',    selector: 'label' },
        { tagName: 'text',    selector: 'fields-text' },
      ],
      attrs: {
        body: { fill: '#FFFBEB', stroke: '#F59E0B', strokeWidth: 2 },
        separator: {
          stroke: '#F59E0B', strokeWidth: 1,
          x1: '-40%', y1: 0, x2: '40%', y2: 0,
          display: 'none',
        },
        label: {
          refX: '50%', refY: '50%',
          textAnchor: 'middle', textVerticalAnchor: 'middle',
          fill: '#92400E', fontSize: 12, fontWeight: 'bold',
        },
        'fields-text': {
          refX: '50%', refY: '50%',
          textAnchor: 'middle', textVerticalAnchor: 'top',
          fill: '#92400E', fontSize: 11, whiteSpace: 'pre',
        },
      },
      ports: { ...ASSOC_PORTS },
    }, true);
  }

  dispose(): void {
    this._graph?.dispose();
  }
}
