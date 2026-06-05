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

  // ── Éditeur inline HTML positionné sur le canvas ──────────────────────────
  private openInlineInput(opts: {
    clientX: number;
    clientY: number;
    width: number;
    value: string;
    fixedHeight?: number;
    validate?: (v: string) => boolean;
    onConfirm: (v: string) => void;
    inputStyle?: { [key: string]: string };
  }): void {
    document.getElementById('x6-inline-editor-wrapper')?.remove();

    const w = Math.max(opts.width, 80);

    const wrapper = document.createElement('div');
    wrapper.id = 'x6-inline-editor-wrapper';
    // Si fixedHeight fourni : clientY est le CENTRE → top = clientY - h/2
    // Sinon : fallback à 14px (demi-hauteur CSS d'un input standard ~28px)
    const topOffset = opts.fixedHeight != null ? opts.fixedHeight / 2 : 14;
    Object.assign(wrapper.style, {
      position:      'fixed',
      left:          `${opts.clientX - w / 2}px`,
      top:           `${opts.clientY - topOffset}px`,
      width:         `${w}px`,
      zIndex:        '9999',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'stretch',
    });

    const input = document.createElement('input');
    input.id = 'x6-inline-editor';
    input.type = 'text';
    input.value = opts.value;
    Object.assign(input.style, {
      border:       '2px solid #0061d5',
      borderRadius: '4px',
      padding:      '3px 8px',
      fontSize:     '13px',
      fontWeight:   '600',
      fontFamily:   'inherit',
      textAlign:    'center',
      outline:      'none',
      background:   'white',
      boxShadow:    '0 2px 12px rgba(0,0,0,0.18)',
      width:        '100%',
      boxSizing:    'border-box',
    });
    if (opts.inputStyle) Object.assign(input.style, opts.inputStyle);
    // Hauteur exacte pour coller à l'en-tête (zoom inclus) + suppression du padding vertical
    if (opts.fixedHeight != null) {
      input.style.height  = `${opts.fixedHeight}px`;
      input.style.padding = '0 8px';
    }
    const defaultBorderColor = input.style.borderColor;
    const defaultColor       = input.style.color;

    const errorMsg = document.createElement('div');
    Object.assign(errorMsg.style, {
      display:      'none',
      color:        '#ef4444',
      fontSize:     '11px',
      marginTop:    '3px',
      textAlign:    'center',
      background:   '#fff',
      borderRadius: '3px',
      padding:      '2px 4px',
      boxShadow:    '0 1px 4px rgba(0,0,0,0.12)',
    });
    errorMsg.textContent = 'Format : chiffre,chiffre ou chiffre,N  (ex : 0,1 — 1,N)';

    wrapper.appendChild(input);
    wrapper.appendChild(errorMsg);

    let done = false;

    const close = (save: boolean, fromEnter = false) => {
      if (done) return;
      const val = input.value.trim().replace('.', ',');
      if (save && val) {
        if (opts.validate && !opts.validate(val)) {
          if (fromEnter) {
            input.value = val;
            input.style.borderColor = '#ef4444';
            input.style.color = '#ef4444';
            errorMsg.style.display = 'block';
            input.select();
            return;
          }
          done = true;
          wrapper.remove();
          return;
        }
        done = true;
        wrapper.remove();
        opts.onConfirm(val);
      } else {
        done = true;
        wrapper.remove();
      }
    };

    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // évite que X6 intercepte Delete/Ctrl+Z etc.
      if (e.key === 'Enter')  { e.preventDefault(); close(true, true); }
      if (e.key === 'Escape') { close(false); }
    });

    input.addEventListener('input', () => {
      if (errorMsg.style.display !== 'none') {
        errorMsg.style.display = 'none';
        input.style.borderColor = defaultBorderColor;
        input.style.color       = defaultColor;
      }
    });

    input.addEventListener('blur', () => setTimeout(() => close(true, false), 150));

    document.body.appendChild(wrapper);
    requestAnimationFrame(() => { input.focus(); input.select(); });
  }

  bindGraphEvents(graph: Graph, cb: McdGraphCallbacks): void {
    this.bindNodeHover(graph, cb);
    this.bindGeometrySync(graph, cb);
    this.bindEdgeEvents(graph, cb);
    this.bindConnectionEvents(graph, cb);
    this.bindNodeLifecycle(graph, cb);
    this.bindRenameShortcuts(graph, cb);
  }

  private bindRenameShortcuts(graph: Graph, cb: McdGraphCallbacks): void {
    graph.on('node:dblclick', ({ node }) => {
      this.renameNode(node, graph, cb);
    });

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'F2') return;
      if ((document.activeElement as HTMLElement)?.tagName === 'INPUT') return;
      const selected = graph.getSelectedCells().filter(c => c.isNode());
      if (selected.length === 1) {
        e.preventDefault();
        this.renameNode(selected[0] as Node, graph, cb);
      }
    });
  }

  private bindNodeHover(graph: Graph, cb: McdGraphCallbacks): void {
    graph.on('node:mouseenter', ({ node }) => {
      node.getPorts().forEach(port => {
        node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
      });

      // Survol d'une association → montrer les ports des entités (cibles potentielles)
      if (node.shape === 'merise-assoc') {
        graph.getNodes().forEach(n => {
          if (n.shape === 'merise-entity') {
            n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible'));
          }
        });
      }

      // Survol d'une entité → montrer les ports des associations (cibles pour drag entité→assoc)
      if (node.shape === 'merise-entity') {
        graph.getNodes().forEach(n => {
          if (n.shape === 'merise-assoc') {
            n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible'));
          }
        });
      }

      const data = node.getData();
      const fields: any[] = data?.fields || [];
      const tools: any[] = [
        this.makeDeleteNodeTool(cb),
        this.makeRenameTool(node, cb, graph),
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

          // Quitter une association → cacher les ports des entités
          if (node.shape === 'merise-assoc') {
            graph.getNodes().forEach(n => {
              if (n.shape === 'merise-entity' && !graph.isSelected(n)) {
                n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden'));
              }
            });
          }

          // Quitter une entité → cacher les ports des associations
          if (node.shape === 'merise-entity') {
            graph.getNodes().forEach(n => {
              if (n.shape === 'merise-assoc' && !graph.isSelected(n)) {
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

  private renameNode(node: Node, graph: Graph, cb: McdGraphCallbacks): void {
    const data     = node.getData();
    const pos      = node.getPosition();
    const size     = node.getSize();
    const isEntity = node.shape === 'merise-entity';

    // Insérer un <foreignObject> dans le même groupe SVG que le nœud :
    // il hérite du transform pan+zoom → immunisé aux CSS transforms parents Angular.
    const view = graph.findViewByCell(node);
    if (!view) return;
    const nodeGroup = view.container as SVGGElement;
    const canvas    = nodeGroup.parentElement as SVGGElement | null;
    if (!canvas) return;
    canvas.querySelector('#x6-rename-fo')?.remove();

    // Coordonnées en espace graphe (28 = hauteur de l'en-tête)
    const foY = isEntity ? pos.y : pos.y + (size.height - 28) / 2;

    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.id = 'x6-rename-fo';
    fo.setAttribute('x',      String(pos.x));
    fo.setAttribute('y',      String(foY));
    fo.setAttribute('width',  String(size.width));
    fo.setAttribute('height', '28');

    const input = document.createElement('input');
    input.type  = 'text';
    input.value = data.name;
    Object.assign(input.style, {
      width:        '100%',
      height:       '100%',
      border:       'none',
      outline:      'none',
      background:   isEntity ? '#0061d5' : '#FFFBEB',
      color:        isEntity ? '#ffffff' : '#92400E',
      fontSize:     '12px',
      fontWeight:   '600',
      fontFamily:   'inherit',
      textAlign:    'center',
      padding:      '0 8px',
      boxSizing:    'border-box',
      borderBottom: isEntity ? '2px solid rgba(255,255,255,0.5)' : '2px solid #F59E0B',
      borderRadius: isEntity ? '0'                               : '4px',
      display:      'block',
    });

    fo.appendChild(input);
    canvas.appendChild(fo);

    let done = false;
    const confirm = (save: boolean) => {
      if (done) return;
      done = true;
      fo.remove();
      if (!save) return;
      const newName = input.value.trim();
      if (!newName) return;
      cb.saveToHistory();
      data.name = newName;
      node.setData(data, { overwrite: true });
      node.setAttrs({ label: { text: newName } });
      const mcd = cb.getMcd();
      const obj  = mcd?.Entities.find(e => e.id === data.id)
                || mcd?.Associations.find(a => a.id === data.id);
      if (obj) obj.name = newName;
      cb.autoSave();
    };

    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter')  { e.preventDefault(); confirm(true); }
      if (e.key === 'Escape') { confirm(false); }
    });
    input.addEventListener('blur', () => setTimeout(() => confirm(true), 150));

    requestAnimationFrame(() => { input.focus(); input.select(); });
  }

  private makeRenameTool(node: Node, cb: McdGraphCallbacks, graph: Graph): any {
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
        onClick: () => this.renameNode(node, graph, cb),
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
    graph.on('edge:dblclick', ({ edge, e }) => {
      e.stopPropagation();
      const link = edge.getData<Link>();
      if (!link) return;

      const CARD_REGEX = /^[0-9],[0-9Nn]$/;

      this.openInlineInput({
        clientX:  e.clientX,
        clientY:  e.clientY,
        width:    90,
        value:    link.cardinality,
        validate: (v) => CARD_REGEX.test(v),
        onConfirm: (newCard) => {
          cb.saveToHistory();
          link.modifyCardinality(newCard as any);

          const mcdLink = cb.getMcd()?.Links.find(l => l.id === link.id);
          if (mcdLink) mcdLink.cardinality = newCard;

          edge.setLabels([{ attrs: {
            label: { text: newCard, fill: '#334155', fontWeight: 'bold' },
            rect:  { fill: '#ffffff', stroke: '#1890ff', strokeWidth: 1, rx: 4, ry: 4 },
          } }]);
          cb.autoSave();
        },
      });
    });

    graph.on('edge:mouseenter', ({ edge }) => {
      edge.addTools([
        // Bouton supprimer (croix rouge)
        {
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
        },
        // Bouton renommer la cardinalité (crayon vert) — positionné au milieu du lien
        {
          name: 'button',
          args: {
            distance: '52%',
            offset: -16,
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
            onClick: () => {
              const link = edge.getData<Link>();
              if (!link) return;

              // Position du label de cardinalité dans le DOM
              let clientX: number;
              let clientY: number;
              const view = graph.findViewByCell(edge);
              const labelEl = view?.container?.querySelector('.x6-edge-label');
              if (labelEl) {
                const rect = (labelEl as HTMLElement).getBoundingClientRect();
                clientX = rect.left + rect.width  / 2;
                clientY = rect.top  + rect.height / 2;
              } else {
                const bbox = edge.getBBox();
                const containerRect = graph.container.getBoundingClientRect();
                const localCenter = graph.graphToLocal(
                  bbox.x + bbox.width  / 2,
                  bbox.y + bbox.height / 2,
                );
                clientX = containerRect.left + localCenter.x;
                clientY = containerRect.top  + localCenter.y;
              }

              const CARD_REGEX = /^[0-9],[0-9Nn]$/;
              this.openInlineInput({
                clientX,
                clientY,
                width:    90,
                value:    link.cardinality,
                validate: (v) => CARD_REGEX.test(v),
                onConfirm: (newCard) => {
                  cb.saveToHistory();
                  link.modifyCardinality(newCard as any);
                  const mcdLink = cb.getMcd()?.Links.find(l => l.id === link.id);
                  if (mcdLink) mcdLink.cardinality = newCard;
                  edge.setLabels([{ attrs: {
                    label: { text: newCard, fill: '#334155', fontWeight: 'bold' },
                    rect:  { fill: '#ffffff', stroke: '#1890ff', strokeWidth: 1, rx: 4, ry: 4 },
                  } }]);
                  cb.autoSave();
                },
              });
            },
          },
        },
      ]);
    });

    graph.on('edge:mouseleave', ({ edge }) => {
      edge.attr('line/stroke', '#334155');
      edge.attr('line/strokeWidth', 2);
      edge.removeTools();
    });
  }

  private bindConnectionEvents(graph: Graph, cb: McdGraphCallbacks): void {
    const hideAllPorts = () => {
      if (!cb.isConnecting()) return;
      cb.setConnecting(false);
      graph.getNodes().forEach(n => {
        if (!graph.isSelected(n)) {
          n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden'));
        }
      });
    };

    graph.on('node:mousedown', ({ node }) => {
      // Drag depuis une association → montrer les ports des entités
      if (node.shape === 'merise-assoc') {
        cb.setConnecting(true);
        graph.getNodes().forEach(n => {
          if (n.shape === 'merise-entity') {
            n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible'));
          }
        });
      }
      // Drag depuis une entité → montrer les ports des associations
      else if (node.shape === 'merise-entity') {
        cb.setConnecting(true);
        graph.getNodes().forEach(n => {
          if (n.shape === 'merise-assoc') {
            n.getPorts().forEach(port => n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible'));
          }
        });
      }
    });

    graph.on('edge:connected', ({ edge }) => {
      hideAllPorts();
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

    graph.on('blank:mouseup', hideAllPorts);
    graph.on('node:mouseup', hideAllPorts);
    graph.on('edge:mouseup', hideAllPorts);
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
