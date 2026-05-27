import { Injectable } from '@angular/core';
import { Graph, Node } from '@antv/x6';
import { Mcd } from '../models/mcd';
import { Entity } from '../models/entity';
import { Association } from '../models/association';
import { Link, MERISE_CARDINALITIES } from '../models/link';

const LINE_HEIGHT = 22;
const START_Y = 35;

export interface McdGraphCallbacks {
  getMcd(): Mcd | undefined;
  saveToHistory(): void;
  autoSave(): void;
  updateNodeDisplay(node: any): void;
  removeNodeFromModel(node: Node): void;
  triggerPicker(node: Node, fields: any[], slug: string): void;
  getSlug(): string;
  isConnecting(): boolean;
  setConnecting(v: boolean): void;
  isResettingGraph(): boolean;
  getPendingDrops(): Map<string, Entity | Association>;
  isResizingSaved(): boolean;
  setResizingSaved(v: boolean): void;
  setIsResizing(v: boolean): void;
  getIsResizing(): boolean;
}

@Injectable()
export class McdEventsService {

  bindGraphEvents(graph: Graph, cb: McdGraphCallbacks): void {
    this.bindNodeHover(graph, cb);
    this.bindGeometrySync(graph, cb);
    this.bindEdgeEvents(graph, cb);
    this.bindConnectionEvents(graph, cb);
    this.bindNodeLifecycle(graph, cb);
  }

  private bindNodeHover(graph: Graph, cb: McdGraphCallbacks): void {
    graph.on('node:mouseenter', ({ node }) => {
      node.getPorts().forEach(port => {
        node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
      });

      if (node.shape === 'merise-assoc') {
        graph.getNodes().forEach(n => {
          if (n.shape === 'merise-entity') {
            n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible'));
          }
        });
      }

      const data = node.getData();
      const fields: any[] = data?.fields || [];
      const tools: any[] = [
        this.makeDeleteNodeTool(cb),
        this.makeRenameTool(node, cb),
        this.makeAddFieldTool(node, cb),
      ];

      if (node.shape === 'merise-entity') {
        fields.forEach((_: any, index: number) => {
          const tool = this.makeEntityFieldDeleteTool(index, node, cb);
          if (tool) tools.push(tool);
        });
      }
      if (node.shape === 'merise-assoc') {
        const { width } = node.getSize();
        fields.forEach((_: any, index: number) => tools.push(this.makeAssocFieldDeleteTool(index, fields, width, cb)));
      }

      node.addTools(tools);
      node.setAttrByPath('delete-group/visibility', 'visible');
      node.setAttrByPath('delete-btn/visibility', 'visible');
    });

    graph.on('node:mouseleave', ({ node }) => {
      if (!graph.isSelected(node)) {
        if (!cb.isConnecting()) {
          node.getPorts().forEach(port => node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden'));

          if (node.shape === 'merise-assoc') {
            graph.getNodes().forEach(n => {
              if (n.shape === 'merise-entity' && !graph.isSelected(n)) {
                n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden'));
              }
            });
          }
        }
        node.setAttrByPath('delete-group/visibility', 'hidden');
        node.setAttrByPath('delete-btn/visibility', 'hidden');
      }
      node.removeTools();
    });
  }

  private makeDeleteNodeTool(cb: McdGraphCallbacks): any {
    return {
      name: 'button-remove',
      args: {
        x: '100%', y: 0, offset: { x: -10, y: 10 },
        onClick: ({ view }: { view: any }) => {
          const target = view.cell as Node;
          cb.saveToHistory();
          cb.removeNodeFromModel(target);
          target.remove();
          cb.autoSave();
        },
      },
    };
  }

  private makeRenameTool(node: Node, cb: McdGraphCallbacks): any {
    return {
      name: 'button',
      args: {
        markup: [
          { tagName: 'circle', selector: 'button', attrs: { stroke: '#2ecc71', 'stroke-width': 2, r: 8, fill: '#fff', cursor: 'pointer' } },
          {
            tagName: 'path', selector: 'icon',
            attrs: {
              d: 'M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z',
              fill: '#2ecc71', transform: 'scale(0.3) translate(-12, -12)', 'pointer-events': 'none',
            },
          },
        ],
        x: '100%', y: 0, offset: { x: -35, y: 10 },
        onClick: () => {
          const data = node.getData();
          const newName = window.prompt('Nouveau nom :', data.name);
          if (!newName?.trim()) return;

          const trimmed = newName.trim();
          cb.saveToHistory();
          data.name = trimmed;
          node.setData(data, { overwrite: true });
          node.setAttrs({ label: { text: trimmed } });

          const mcd = cb.getMcd();
          const obj = mcd?.Entities.find(e => e.id === data.id) || mcd?.Associations.find(a => a.id === data.id);
          if (obj) obj.name = trimmed;
          cb.autoSave();
        },
      },
    };
  }

  private makeAddFieldTool(node: Node, cb: McdGraphCallbacks): any {
    return {
      name: 'button',
      args: {
        markup: [
          { tagName: 'circle', selector: 'button', attrs: { r: 10, stroke: '#1890ff', 'stroke-width': 2, fill: 'white', cursor: 'pointer' } },
          { tagName: 'path', selector: 'icon', attrs: { d: 'M-5 0 L5 0 M0 -5 L0 5', stroke: '#1890ff', 'stroke-width': 2, 'pointer-events': 'none' } },
        ],
        x: '100%', y: '100%',
        offset: { x: node.shape === 'merise-assoc' ? -10 : -15, y: node.shape === 'merise-assoc' ? -10 : -15 },
        onClick: ({ view }: { view: any }) => {
          const n = view.cell;
          const d = n.getData();
          cb.triggerPicker(n, d.fields || [], cb.getSlug());
        },
      },
    };
  }

  private makeEntityFieldDeleteTool(index: number, node: Node, cb: McdGraphCallbacks): any {
    const { height } = node.getSize();
    const maxVisibleFields = Math.max(0, Math.floor((height - START_Y - 10) / LINE_HEIGHT));
    if (index >= maxVisibleFields) return null;

    return {
      name: 'button-remove',
      args: {
        x: '100%',
        y: START_Y + (index * LINE_HEIGHT) + (LINE_HEIGHT / 2) - 5,
        offset: { x: -35, y: 5 },
        markup: [
          { tagName: 'circle', selector: 'button', attrs: { r: 6, fill: '#ff4d4f', cursor: 'pointer' } },
          { tagName: 'path', selector: 'icon', attrs: { d: 'M -3 -3 L 3 3 M -3 3 L 3 -3', stroke: '#FFFFFF', strokeWidth: 2 } },
        ],
        onClick: ({ view }: { view: any }) => {
          const n = view.cell;
          const d = n.getData();
          cb.saveToHistory();
          d.fields.splice(index, 1);
          n.setData({ ...d }, { overwrite: true });
          n.removeTools();
          cb.updateNodeDisplay(n);
          // Mise à jour du modèle MCD en mémoire (d peut être une copie selon X6)
          const mcd = cb.getMcd();
          const obj = mcd?.Entities.find(e => e.id === d.id) || mcd?.Associations.find(a => a.id === d.id);
          if (obj) obj.fields = [...d.fields];
          cb.autoSave();
        },
      },
    };
  }

  private makeAssocFieldDeleteTool(index: number, fields: any[], nodeWidth: number, cb: McdGraphCallbacks): any {
    const fieldWidth = fields.length > 0 ? nodeWidth / fields.length : nodeWidth;
    const crossX = (index * fieldWidth) + (fieldWidth / 2);
    return {
      name: 'button-remove',
      args: {
        x: crossX, y: 55, offset: { x: 0, y: 0 },
        markup: [
          { tagName: 'circle', selector: 'button', attrs: { r: 5, fill: '#ff4d4f', cursor: 'pointer' } },
          { tagName: 'path', selector: 'icon', attrs: { d: 'M -3 -3 L 3 3 M -3 3 L 3 -3', stroke: '#FFFFFF', strokeWidth: 2, pointerEvents: 'none' } },
        ],
        onClick: ({ view }: { view: any }) => {
          const n = view.cell;
          const d = n.getData();
          cb.saveToHistory();
          d.fields.splice(index, 1);
          n.setData({ ...d }, { overwrite: true });
          n.removeTools();
          cb.updateNodeDisplay(n);
          // Mise à jour du modèle MCD en mémoire
          const mcd = cb.getMcd();
          const obj = mcd?.Entities.find(e => e.id === d.id) || mcd?.Associations.find(a => a.id === d.id);
          if (obj) obj.fields = [...d.fields];
          cb.autoSave();
        },
      },
    };
  }

  private bindGeometrySync(graph: Graph, cb: McdGraphCallbacks): void {
    const syncGeometry = ({ node }: { node: Node }) => {
      const mcd = cb.getMcd();
      if (!mcd) return;
      const data = node.getData();
      if (!data?.id) return;

      const { x, y } = node.getPosition();
      const { width, height } = node.getSize();

      const obj = mcd.Entities.find(e => e.id === data.id) || mcd.Associations.find(a => a.id === data.id);
      if (!obj) return;

      obj.posX = x; obj.posY = y; obj.width = width; obj.height = height;
      cb.autoSave();
    };

    graph.on('node:moved', ({ node }) => {
      cb.saveToHistory();
      syncGeometry({ node });
    });

    graph.on('node:resizing', ({ node }) => {
      if (!cb.isResizingSaved() && cb.getMcd()) {
        cb.saveToHistory();
        cb.setResizingSaved(true);
      }
      cb.setIsResizing(true);
      if (node.shape === 'merise-entity') cb.updateNodeDisplay(node);
    });

    graph.on('node:resized', ({ node }) => {
      cb.setResizingSaved(false);
      syncGeometry({ node });

      if (node.shape === 'merise-entity') cb.updateNodeDisplay(node);

      cb.setIsResizing(false);
    });

    graph.on('node:change:data', ({ node }) => {
      if (cb.isResettingGraph()) return;
      cb.updateNodeDisplay(node);
    });
  }

  private bindEdgeEvents(graph: Graph, cb: McdGraphCallbacks): void {
    graph.on('edge:click', ({ edge, e }) => {
      e.stopPropagation();
      const link = edge.getData<Link>();
      if (!link) return;

      const currentIndex = MERISE_CARDINALITIES.indexOf(link.cardinality as any);
      const nextCard = MERISE_CARDINALITIES[(currentIndex + 1) % MERISE_CARDINALITIES.length];

      cb.saveToHistory();
      link.modifyCardinality(nextCard as any);

      const mcdLink = cb.getMcd()?.Links.find(l => l.id === link.id);
      if (mcdLink) mcdLink.cardinality = nextCard;

      edge.setLabels([{ attrs: { label: { text: nextCard, fill: '#334155', fontWeight: 'bold' }, rect: { fill: '#ffffff', stroke: '#1890ff', strokeWidth: 1, rx: 4, ry: 4 } } }]);
      cb.autoSave();
    });

    graph.on('edge:mouseenter', ({ edge }) => {
      edge.addTools([{
        name: 'button-remove',
        args: {
          distance: '40', offset: 5,
          markup: [
            { tagName: 'circle', selector: 'button', attrs: { r: 8, fill: '#ff4d4f', stroke: '#fff', strokeWidth: 2, cursor: 'pointer' } },
            { tagName: 'text', selector: 'icon', textContent: '×', attrs: { fill: '#fff', fontSize: 15, fontWeight: 'bold', textAnchor: 'middle', dominantBaseline: 'central', pointerEvents: 'none' } },
          ],
          onClick: ({ view }: { view: any }) => {
            const e = view.cell;
            const link = e.getData ? (e.getData() as any) : null;
            const mcd = cb.getMcd();
            if (link && mcd) {
              cb.saveToHistory();
              mcd.Links = mcd.Links.filter((l: Link) => l.id !== link.id);
            }
            e.remove();
            cb.autoSave();
          },
        },
      }]);
    });

    graph.on('edge:mouseleave', ({ edge }) => {
      edge.attr('line/stroke', '#334155');
      edge.attr('line/strokeWidth', 2);
      edge.removeTools();
    });
  }

  private bindConnectionEvents(graph: Graph, cb: McdGraphCallbacks): void {
    const hideEntityPorts = () => {
      if (!cb.isConnecting()) return;
      cb.setConnecting(false);
      graph.getNodes().forEach(n => {
        if (n.shape === 'merise-entity' && !graph.isSelected(n)) {
          n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden'));
        }
      });
    };

    graph.on('node:mousedown', ({ node }) => {
      if (node.shape !== 'merise-assoc') return;
      cb.setConnecting(true);
      graph.getNodes().forEach(n => {
        if (n.shape === 'merise-entity') {
          n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible'));
        }
      });
    });

    graph.on('edge:connected', ({ edge }) => {
      hideEntityPorts();
      const mcd = cb.getMcd();
      if (!mcd) return;

      const sourceNode = edge.getSourceNode();
      const targetNode = edge.getTargetNode();
      if (!sourceNode || !targetNode) { graph.removeEdge(edge); return; }

      const assocNode = sourceNode.shape === 'merise-assoc' ? sourceNode : targetNode;
      const entityNode = sourceNode.shape === 'merise-entity' ? sourceNode : targetNode;
      const assoc = assocNode.getData<Association>();
      const entity = entityNode.getData<Entity>();

      if (!assoc?.id || !entity?.id) { graph.removeEdge(edge); return; }

      const defaultCard = MERISE_CARDINALITIES[0];
      const link = new Link(defaultCard, assoc.id, entity.id);
      cb.saveToHistory();
      mcd.Links.push(link);

      edge.setData(link);
      edge.setLabels([{ attrs: { label: { text: defaultCard, fill: '#334155', fontWeight: 'bold' }, rect: { fill: '#ffffff', stroke: '#334155', strokeWidth: 1, rx: 4, ry: 4 } } }]);
      edge.setData(link, { overwrite: true });
      cb.autoSave();
    });

    graph.on('blank:mouseup', hideEntityPorts);
    graph.on('node:mouseup', hideEntityPorts);
    graph.on('edge:mouseup', hideEntityPorts);
  }

  private bindNodeLifecycle(graph: Graph, cb: McdGraphCallbacks): void {
    // Push into model after a real DnD drop.
    // pendingDrops keeps class instances (Entity/Association) before the Dnd clone,
    // preserving methods lost by X6's JSON serialization.
    graph.on('node:added', ({ node }) => {
      const mcd = cb.getMcd();
      if (!mcd) return;
      const data = node.getData();
      if (!data?.id) return;

      const original = cb.getPendingDrops().get(data.id);
      if (!original) return;

      cb.saveToHistory();
      node.setData(original, { overwrite: true });

      if (node.shape === 'merise-entity') mcd.Entities.push(original as Entity);
      else if (node.shape === 'merise-assoc') mcd.Associations.push(original as Association);

      cb.getPendingDrops().delete(data.id);

      // X6 Dnd fixes final position after node:added, so we defer the read by 50ms.
      setTimeout(() => {
        const { x, y } = node.getPosition();
        const { width, height } = node.getSize();
        original.posX = x; original.posY = y; original.width = width; original.height = height;
        cb.autoSave();
      }, 50);
    });

    // Safety net: if a node is removed by any other path, keep the model in sync.
    // isResettingGraph prevents a spurious autoSave during drawMcd → clearCells.
    graph.on('node:removed', ({ node }: { node: Node }) => {
      if (cb.isResettingGraph()) return;
      const mcd = cb.getMcd();
      if (!mcd) return;
      cb.removeNodeFromModel(node);
      cb.autoSave();
    });
  }
}
