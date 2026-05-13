import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Graph, Node, Edge } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Transform } from '@antv/x6-plugin-transform';
import { Subscription } from 'rxjs';

import { Mcd } from '../../models/mcd';
import { Entity } from '../../models/entity';
import { Association } from '../../models/association';
import { Link, MERISE_CARDINALITIES } from '../../models/link';
import { Field } from '../../models/field';
import { McdService } from '../../services/mcd.service';
import { TableService } from '../../services/table.service';
import { DictionaryService } from '../../services/dictionary.service';
import { ChoixChampComponent } from '../choix-champ/choix-champ.component';
import { ToolButtonComponent } from '../toll-button/toll-button.component';

// ─── Configuration des ports réutilisable ────────────────────────────────────

/**
 * Groupes de ports cardinaux (N/S/E/O) partagés par Entités et Associations.
 *
 * RÈGLE MERISE :
 *   - Entités et Associations ont magnet: true pour permettre le drag dans les
 *     deux sens. La règle entity↔assoc est enforced par validateConnection.
 *
 * Les ports sont invisibles par défaut et n'apparaissent qu'au survol du nœud
 * grâce aux attrs.circle.style.visibility contrôlé via connected:highlight.
 */
const ENTITY_PORTS = {
  groups: {
    top: { position: 'top', attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
    bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
    left: { position: 'left', attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
    right: { position: 'right', attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
  },
  items: [
    { group: 'top' },
    { group: 'bottom' },
    { group: 'left' },
    { group: 'right' },
  ]
};

const ASSOC_PORTS = {
  groups: {
    top: { position: 'top', attrs: { circle: { r: 6, magnet: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5, style: { visibility: 'hidden' } } } },
    bottom: { position: 'bottom', attrs: { circle: { r: 6, magnet: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5, style: { visibility: 'hidden' } } } },
    left: { position: 'left', attrs: { circle: { r: 6, magnet: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5, style: { visibility: 'hidden' } } } },
    right: { position: 'right', attrs: { circle: { r: 6, magnet: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5, style: { visibility: 'hidden' } } } },
  },
  items: [
    { group: 'top' },
    { group: 'bottom' },
    { group: 'left' },
    { group: 'right' },
  ]
};

const HEADER_HEIGHT = 32;
const LINE_HEIGHT = 22; // Un peu plus grand pour aérer comme sur l'image
const START_Y = 35;     // Position du premier champ



@Component({
  selector: 'app-mcd-editor',
  standalone: true,
  imports: [CommonModule, ToolButtonComponent, ChoixChampComponent],
  templateUrl: './mcd-editor.component.html',
  styleUrls: ['./mcd-editor.component.css']
})
export class McdEditorComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef;
  @Input() slug: string = '';
  @Input() mcd: Mcd | undefined;

  private graph?: Graph;
  private dnd?: Dnd;
  private connecting = false;

  showPicker = false;
  public pickerNode: Node | null = null;
  pickerCurrentNames: string[] = [];
  pickerAvailableNames: string[] = [];
  private pickerSub?: Subscription;
  private dictSub?: Subscription;

  constructor(
    private mcdService: McdService,
    private tableService: TableService,
    private dictionaryService: DictionaryService
  ) { }
  // ─────────────────────────────────────────────────────────────────────────────
  // Cycle de vie
  // ─────────────────────────────────────────────────────────────────────────────


  ngOnInit(): void {
    const savedMcd = this.mcdService.loadMcd(this.slug);
    if (savedMcd) this.mcd = savedMcd;

    setTimeout(() => {
      this.initGraph();
      if (this.mcd) this.drawMcd();
    }, 100);

    this.pickerSub = this.tableService.openPicker$.subscribe(({ node, currentFields, slug }) => {
      const activeSlug = slug || this.slug;
      const allFields = this.dictionaryService.load(activeSlug);

      // RÉCUPÈRE LES CHAMPS RÉELS DU NŒUD (ceux qui n'ont pas été supprimés)
      const nodeData = node.getData();
      const actualFields = nodeData.fields || [];

      this.pickerAvailableNames = allFields.map(f => f.TechnicalName);
      // On met à jour la liste des champs déjà sélectionnés
      this.pickerCurrentNames = actualFields.map((f: any) => f.TechnicalName);

      this.pickerNode = node;
      this.showPicker = true;
    });

    this.dictSub = this.dictionaryService.onUpdated$.subscribe(({ slug, fields }) => {
      if (slug !== this.slug || !this.graph) return;

      this.graph.getNodes().forEach(node => {
        const data = node.getData();
        if (!data?.fields) return;

        const updatedFields = data.fields.map((f: any) => {
          const dictField = fields.find((df: any) => df.TechnicalName === f.TechnicalName);
          return dictField ? { ...f, Type: dictField.Type } : f;
        });

        node.setData({ ...data, fields: updatedFields }, { overwrite: true });
        this.updateNodeDisplay(node);
      });
    });
  }

  ngOnDestroy(): void {
    this.graph?.dispose();
    this.pickerSub?.unsubscribe();
    this.dictSub?.unsubscribe();
  }

  // À mettre dans mcd-editor.component.ts

  ngAfterViewInit(): void {
    // On utilise un setTimeout pour s'assurer que le navigateur
    // a fini d'appliquer le CSS (flexbox, grid, etc.) sur #container
    setTimeout(() => {
      if (this.graph) {
        // Sécurité : on nettoie les cellules fantômes (optionnel)
        this.graph.clearCells();

        // --- C'EST ICI QUE CA SE PASSE : LE RESIZE FORCÉ ---
        // On récupère le conteneur HTML du graphe
        const container = document.getElementById('container');

        if (container) {
          // On récupère sa taille RÉELLE calculée par le navigateur
          const width = container.clientWidth;
          const height = container.clientHeight;

          // On force le graphe à s'adapter à cette taille
          this.graph.resize(width, height);

          console.log(`[MCD] Graphe redimensionné : ${width}x${height}`);
        }
      }
    }, 100);
  }

  updateNodeDisplay(node: any) {
    const data = node.getData();
    const fields: any[] = data.fields || [];
    const hasFields = fields.length > 0;

    if (node.shape === 'merise-assoc') {
      const fieldsContent = fields.map((f: any) => f.TechnicalName).join('          ');


      const baseWidth = 120;
      const dynamicWidth = hasFields ? Math.max(baseWidth, fields.length * 60) : baseWidth;
      const fieldWidth = fields.length > 0 ? dynamicWidth / fields.length : dynamicWidth;

      node.resize(dynamicWidth, 80);
      node.setAttrs({
        label: {
          refX: '50%',
          refY: hasFields ? '35%' : '50%',
          textVerticalAnchor: 'middle',
        },
        separator: {
          display: 'none'
        },
        'fields-text': {
          text: fieldsContent,
          refX: '50%',
          refY: 40,
          lineHeight: LINE_HEIGHT,
          textVerticalAnchor: 'top',
          textAnchor: 'middle',
          display: hasFields ? 'block' : 'none'
        }
      });
    } else {
      // Logique entité inchangée
      const fieldsContent = fields
        .map((f: any) => `${f.PrimaryKey ? '#' : '-'} ${f.TechnicalName} : ${f.Type}`)
        .join('\n');

      const separatorPath = fields
        .map((_: any, i: number) => {
          if (i === 0) return null;
          const y = START_Y + (i * LINE_HEIGHT);
          return `M 0 ${y} L 200 ${y}`;
        })
        .filter((p): p is string => p !== null)
        .join(' ');

      node.setAttrs({
        'field-separators': {
          d: separatorPath,
          stroke: '#1890ff',
          strokeWidth: 1,
          display: hasFields ? 'block' : 'none'
        },
        'fields-text': {
          text: fieldsContent,
          lineHeight: LINE_HEIGHT,
          refY: START_Y + 5,
          textVerticalAnchor: 'top',
          fontSize: 12,
          fill: '#334155'
        }
      });

      const dynamicHeight = START_Y + (fields.length * LINE_HEIGHT) + 10;
      node.resize(200, Math.max(dynamicHeight, 50));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Suppression clavier (Delete / Backspace)
  // ─────────────────────────────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Si c'est la touche Suppr ou Retour arrière
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;

    // Ne pas intercepter si l'utilisateur tape dans un champ texte
    const tag = (event.target as HTMLElement)?.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;


    const selectedCells = this.graph?.getSelectedCells() ?? [];
    if (selectedCells.length === 0) return;

    selectedCells.forEach(cell => {
      if (cell.isNode()) this.removeNodeFromModel(cell as Node);
      else if (cell.isEdge()) this.removeEdgeFromModel(cell as Edge);
    });

    this.graph?.removeCells(selectedCells);
    this.autoSave();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Initialisation du graphe
  // ─────────────────────────────────────────────────────────────────────────────

  private initGraph(): void {
    this.graph = new Graph({
      container: this.containerRef.nativeElement,
      autoResize: true,
      grid: {
        size: 10,
        visible: true,
        type: 'mesh',
        args: { color: '#e2e8f0', thickness: 1 }
      },
      panning: { enabled: true, modifiers: ['space'] },
      mousewheel: { enabled: true, modifiers: ['ctrl'] },

      // ── Affichage des ports au survol

      highlighting: {
        // Quand un port est prêt à recevoir un lien
        magnetAvailable: {
          name: 'className',
          args: {
            className: 'port-disponible',
          },
        },
        // Quand le lien est "aimanté" au port
        magnetAdsorbed: {
          name: 'className',
          args: {
            className: 'port-aimante',
          },
        },
      },
      connecting: {
        snap: { radius: 30 },
        allowBlank: false,
        allowLoop: false,
        allowMulti: true,
        highlight: true,
        router: 'manhattan',
        connector: { name: 'rounded', args: { radius: 8 } },

        /**
         * RÈGLE MERISE :
         * Un lien ne peut partir QUE d'un port magnet=true (Association)
         * et arriver QUE sur un nœud de shape 'merise-entity'.
         */
        validateConnection({ sourceView, targetView }) {
          const sourceCell = sourceView?.cell as any;
          const targetCell = targetView?.cell as any;

          // isNode() exclut les arêtes et ports qui peuvent capturer le survol
          if (!sourceCell?.isNode?.() || !targetCell?.isNode?.()) return false;

          return sourceCell.shape === 'merise-assoc' && targetCell.shape === 'merise-entity';
        },

        createEdge() {
          return this.createEdge({
            shape: 'edge',
            attrs: {
              line: {
                stroke: '#334155',
                strokeWidth: 2,
                targetMarker: '',  // Pas de flèche : lien Merise non-directionnel
                sourceMarker: ''
              }
            },
            zIndex: 0
          });
        }
      }
    });

    // ── Plugins ──────────────────────────────────────────────────────────────

    this.graph.use(new Selection({
      enabled: true,
      rubberband: true,
      modifiers: ['shift'],
      showNodeSelectionBox: false,
      pointerEvents: 'none',
    }));

    this.graph.use(new Transform({
      resizing: {
        enabled: (node: Node) => node.shape !== 'merise-assoc', // ✅
        orthogonal: false,
        restrict: false,
        preserveAspectRatio: false,
        minWidth: 80,
        minHeight: 40
      },
      rotating: false
    }));

    // ── Formes personnalisées + événements + DnD ──────────────────────────────

    this.registerNodeShapes();
    this.bindGraphEvents();

    this.dnd = new Dnd({
      target: this.graph,
      scaled: false,
      getDragNode: (node) => node.clone(),
      getDropNode: (node) => node.clone(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Formes personnalisées AntV X6
  // ─────────────────────────────────────────────────────────────────────────────


  private registerNodeShapes(): void {
    // ENTITÉ
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
        body: { refWidth: '100%', refHeight: '100%', fill: '#ffffff', stroke: '#0061d5', strokeWidth: 2, rx: 8, ry: 8 },
        header: { refWidth: '100%', height: 28, fill: '#0061d5', rx: 8, ry: 8, stroke: 'none' },
        label: { refX: '50%', refY: 14, textAnchor: 'middle', fill: '#ffffff', fontSize: 12, fontWeight: 'bold' },
        // Dans registerNodeShapes() pour merise-entity
        'fields-text': {
          refX: 8, // Un peu moins de marge à gauche
          refY: 35,
          fill: '#334155',
          fontSize: 11,
          textAnchor: 'start',
          textVerticalAnchor: 'top',
          whiteSpace: 'pre',
          cursor: 'pointer',
          pointerEvents: 'auto' // <--- FORCE LE TEXTE À ÉCOUTER LE CLIC
        }
      },
      ports: { ...ENTITY_PORTS }
    }, true);

    // ASSOCIATION
    Graph.registerNode('merise-assoc', {
      inherit: 'ellipse',
      markup: [
        { tagName: 'ellipse', selector: 'body' },
        { tagName: 'line', selector: 'separator' },
        { tagName: 'text', selector: 'label' },
        { tagName: 'text', selector: 'fields-text' },
      ],
      attrs: {
        body: { fill: '#FFFBEB', stroke: '#F59E0B', strokeWidth: 2 },
        separator: {
          stroke: '#F59E0B', strokeWidth: 1,
          x1: '-40%', y1: 0, x2: '40%', y2: 0, // ligne horizontale au centre
          display: 'none'
        },
        label: {
          refX: '50%', refY: '50%',
          textAnchor: 'middle', textVerticalAnchor: 'middle',
          fill: '#92400E', fontSize: 12, fontWeight: 'bold'
        },
        'fields-text': {
          refX: '50%', refY: '50%',
          textAnchor: 'middle', textVerticalAnchor: 'top',
          fill: '#92400E', fontSize: 11, whiteSpace: 'pre'
        }
      },
      ports: { ...ASSOC_PORTS }
    }, true);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Affichage des ports au survol
  // ─────────────────────────────────────────────────────────────────────────────

  private bindGraphEvents(): void {
    const graph = this.graph; // On crée une référence stable pour TypeScript
    if (!graph) return;

    // --- GESTION DU SURVOL (Ports et Bouton) ---
    graph.on('node:mouseenter', ({ node }) => {
      // 1. Afficher les ports de ce nœud
      node.getPorts().forEach(port => {
        node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
      });

      // Survol d'une assoc : montrer les ports de toutes les entités comme cibles
      if (node.shape === 'merise-assoc') {
        graph.getNodes().forEach(n => {
          if (n.shape === 'merise-entity') {
            n.getPorts().forEach(port => {
              n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
            });
          }
        });
      }

      const data = node.getData();
      const fields = data?.fields || [];
      const tools: any[] = [
        // Bouton de suppression globale du nœud
        {
          name: 'button-remove',
          args: {
            x: '100%',
            y: 0,
            offset: { x: -10, y: 10 },
          },
        },
        // Bouton renommer
        {
          name: 'button',
          args: {
            markup: [
              { tagName: 'circle', selector: 'button', attrs: { stroke: '#2ecc71', 'stroke-width': 2, r: 8, fill: '#fff', cursor: 'pointer' } },
              {
                tagName: 'path', selector: 'icon',
                attrs: {
                  d: 'M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z',
                  fill: '#2ecc71', transform: 'scale(0.3) translate(-12, -12)', 'pointer-events': 'none'
                }
              },
            ],
            x: '100%', y: 0, offset: { x: -35, y: 10 },
            onClick: () => {
              const data = node.getData();
              const newName = window.prompt("Nouveau nom :", data.name);

              if (newName && newName.trim() !== "") {
                const trimmed = newName.trim();
                // Mise à jour en place pour conserver la référence vers this.mcd
                data.name = trimmed;
                node.setData(data, { overwrite: true });
                // Mise à jour visuelle du header
                node.setAttrs({ label: { text: trimmed } });
                this.updateNodeDisplay(node);
                this.autoSave();
              }
            }
          }
        },
        // Bouton pour ajouter un champ (Plus)
        {
          name: 'button',
          args: {
            markup: [
              { tagName: 'circle', selector: 'button', attrs: { r: 10, stroke: '#1890ff', 'stroke-width': 2, fill: 'white', cursor: 'pointer' } },
              { tagName: 'path', selector: 'icon', attrs: { d: 'M-5 0 L5 0 M0 -5 L0 5', stroke: '#1890ff', 'stroke-width': 2, 'pointer-events': 'none' } },
            ],
            x: '100%', y: node.shape === 'merise-assoc' ? '100%' : '100%', offset: { x: node.shape === 'merise-assoc' ? -10 : -15, y: node.shape === 'merise-assoc' ? -10 : -15 },
            onClick: ({ view }: { view: any }) => {
              const n = view.cell; fields.forEach((_: any, index: number) => {
                tools.push({
                  name: 'button-remove',
                  args: {
                    x: '100%',
                    y: 32 + (index * 36) + 12,
                    offset: { x: -20, y: HEADER_HEIGHT + 10 + (index * LINE_HEIGHT) + (LINE_HEIGHT / 2) },
                    markup: [
                      {
                        tagName: 'circle',
                        selector: 'button',
                        attrs: { r: 6, fill: '#ff4d4f', cursor: 'pointer' },
                      },
                      {
                        tagName: 'path',
                        selector: 'icon',
                        attrs: {
                          d: 'M -3 -3 L 3 3 M -3 3 L 3 -3', // Le dessin de la croix
                          fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, 'pointer-events': 'none'
                        },
                      },
                    ],
                    onClick: () => {
                      this.removeFieldFromEntity(node, index);
                      // On force le retrait immédiat des outils pour éviter les boutons fantômes
                      node.removeTools();
                    },
                  },
                });
              });

              const d = n.getData();
              this.tableService.triggerPicker(n, d.fields || [], this.slug);
            }
          }
        }
      ];

      // Bouton : Une petite croix rouge en face de chaque champ (entité)
      if (node.shape === 'merise-entity') {
        fields.forEach((_: any, index: number) => {
          tools.push({
            name: 'button-remove',
            args: {
              x: '100%',
              // START_Y + (index * LINE_HEIGHT) nous place en haut de la ligne
              // On ajoute (LINE_HEIGHT / 2) pour centrer la croix sur le texte
              y: START_Y + (index * LINE_HEIGHT) + (LINE_HEIGHT / 2) - 5,
              offset: { x: -35, y: 5 },
              markup: [
                {
                  tagName: 'circle',
                  selector: 'button',
                  attrs: {
                    r: 6,
                    fill: '#ff4d4f',
                    cursor: 'pointer',
                  },
                },
                {
                  tagName: 'path',
                  selector: 'icon',
                  attrs: {
                    d: 'M -3 -3 L 3 3 M -3 3 L 3 -3',
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  },
                },
              ],
              onClick: ({ view }: { view: any }) => {
                const node = view.cell;
                const data = node.getData();

                // 1. On supprime la donnée
                data.fields.splice(index, 1);
                node.setData({ ...data }, { overwrite: true });

                // 2. IMPORTANT : On vide les outils actuels pour forcer le nettoyage
                node.removeTools();

                // 3. On rafraîchit l'affichage (hauteur, texte)
                this.updateNodeDisplay(node);
              }
            },
          });
        });
      }
      // Bouton : Une petite croix rouge en face de chaque champ (association)
      if (node.shape === 'merise-assoc') {
        const ROW_HEIGHT = LINE_HEIGHT * 2;

        fields.forEach((_: any, index: number) => {
          const { width } = node.getSize(); // Récupère la largeur actuelle du nœud
          const fieldWidth = fields.length > 0 ? width / fields.length : width;
          const crossX = (index * fieldWidth) + (fieldWidth / 2);
          const crossY = 55;
          tools.push({
            name: 'button-remove',
            args: {
              x: crossX,
              y: crossY,
              offset: { x: 0, y: 0 },
              markup: [
                {
                  tagName: 'circle', selector: 'button',
                  attrs: { r: 5, fill: '#ff4d4f', cursor: 'pointer' }
                },
                {
                  tagName: 'path', selector: 'icon',
                  attrs: {
                    d: 'M -3 -3 L 3 3 M -3 3 L 3 -3',
                    stroke: '#FFFFFF', strokeWidth: 2, pointerEvents: 'none'
                  }
                }
              ],
              onClick: ({ view }: { view: any }) => {
                const n = view.cell;
                const d = n.getData();
                d.fields.splice(index, 1);
                n.setData({ ...d }, { overwrite: true });
                n.removeTools();
                this.updateNodeDisplay(n);
                this.autoSave();
              }
            }
          });
        });
      }

      // Appliquer tous les boutons d'un coup
      node.addTools(tools);

      // Gérer la visibilité des anciens sélecteurs si nécessaire
      node.setAttrByPath('delete-group/visibility', 'visible');
      node.setAttrByPath('delete-btn/visibility', 'visible');
    });

    graph.on('node:mouseleave', ({ node }) => {
      if (!graph.isSelected(node)) {
        // Ne pas cacher les ports des entités quand un drag de connexion est en cours
        if (!this.connecting || node.shape !== 'merise-entity') {
          node.getPorts().forEach(port => {
            node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden');
          });
        }
        // En quittant une assoc sans drag actif, masquer aussi les ports des entités
        if (node.shape === 'merise-assoc' && !this.connecting) {
          graph.getNodes().forEach(n => {
            if (n.shape === 'merise-entity' && !graph.isSelected(n)) {
              n.getPorts().forEach(port => {
                n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden');
              });
            }
          });
        }
        node.setAttrByPath('delete-group/visibility', 'hidden');
        node.setAttrByPath('delete-btn/visibility', 'hidden');
      }
      node.removeTools();
    });


    // SYNCHRONISATION GÉOMÉTRIE (Position & Taille)
    const syncGeometry = ({ node }: { node: Node }) => {
      const obj = node.getData<Entity | Association>();
      if (!obj) return;
      const { x, y } = node.getPosition();
      const { width, height } = node.getSize();
      obj.posX = x;
      obj.posY = y;
      obj.width = width;
      obj.height = height;
      this.autoSave();
    };

    graph.on('node:change:position', syncGeometry);
    graph.on('node:resized', syncGeometry);

    graph.on('node:resized', ({ node }) => {
      this.updateNodeDisplay(node);
    });
    // CHANGER CARDINALITÉ (Clic simple sur le lien)
    graph.on('edge:click', ({ edge, e }) => {
      e.stopPropagation();

      const link = edge.getData<Link>();
      if (!link) return;

      // On cherche où on en est dans la liste
      const currentIndex = MERISE_CARDINALITIES.indexOf(link.cardinality as any);

      // On calcule la suivante (si on arrive au bout, on repart à 0)
      const nextIndex = (currentIndex + 1) % MERISE_CARDINALITIES.length;
      const nextCard = MERISE_CARDINALITIES[nextIndex];

      // On enregistre dans l'objet Link
      link.modifyCardinality(nextCard as any);

      // On change le texte sur le dessin
      edge.setLabels([{
        attrs: {
          label: { text: nextCard, fill: '#334155', fontWeight: 'bold' },
          rect: { fill: '#ffffff', stroke: '#1890ff', strokeWidth: 1, rx: 4, ry: 4 }
        }
      }]);

      this.autoSave();
    });

    // CRÉATION DU LIEN (Association <-> Entité, sens indifférent)
    const hideEntityPorts = () => {
      if (!this.connecting) return;
      this.connecting = false;
      graph.getNodes().forEach(n => {
        if (n.shape === 'merise-entity' && !graph.isSelected(n)) {
          n.getPorts().forEach(port => {
            n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden');
          });
        }
      });
    };

    graph.on('edge:connected', ({ edge }) => {
      hideEntityPorts();
      if (!this.mcd) return;

      const sourceNode = edge.getSourceNode();
      const targetNode = edge.getTargetNode();

      // Sécurité si on lâche le lien dans le vide
      if (!sourceNode || !targetNode) {
        this.graph?.removeEdge(edge);
        return;
      }

      // Déterminer quel nœud est l'association et lequel est l'entité,
      // quel que soit le sens du drag
      const assocNode = sourceNode.shape === 'merise-assoc' ? sourceNode : targetNode;
      const entityNode = sourceNode.shape === 'merise-entity' ? sourceNode : targetNode;

      const assoc = assocNode.getData<Association>();
      const entity = entityNode.getData<Entity>();

      // Vérification de la validité de la connexion
      if (!assoc?.id || !entity?.id) {
        this.graph?.removeEdge(edge);
        return;
      }

      // On utilise la première cardinalité par défaut (ex: '1,1')
      const defaultCard = MERISE_CARDINALITIES[0];

      // Création du lien métier
      const link = new Link(defaultCard, assoc.id, entity.id);
      this.mcd.Links.push(link);

      // Attribution des données au lien visuel
      edge.setData(link);
      edge.setLabels([{
        attrs: {
          label: { text: defaultCard, fill: '#334155', fontWeight: 'bold' },
          rect: { fill: '#ffffff', stroke: '#334155', strokeWidth: 1, rx: 4, ry: 4 }
        }
      }]);
      edge.setData(link, { overwrite: true });
      this.autoSave();
    });

    graph.on('node:port:mousedown', ({ node }) => {
      if (node.shape !== 'merise-assoc') return;
      this.connecting = true;
      graph.getNodes().forEach(n => {
        if (n.shape === 'merise-entity') {
          n.getPorts().forEach(port => {
            n.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
          });
        }
      });
    });

    // Cacher les ports si le drag est abandonné (lâché dans le vide ou sur un lien)
    graph.on('blank:mouseup', hideEntityPorts);
    graph.on('node:mouseup', hideEntityPorts);
    graph.on('edge:mouseup', hideEntityPorts);


    // ── Afficher le bouton de suppression au survol du lien ─────────────────
    graph.on('edge:mouseenter', ({ edge }) => {
      edge.addTools([
        {
          name: 'button-remove',
          args: {
            distance: '40', // Place la croix au milieu du lien
            offset: 5,      // Décale un peu la croix pour ne pas cacher le texte (cardinalité)
            markup: [
              {
                tagName: 'circle',
                selector: 'button',
                attrs: { r: 8, fill: '#ff4d4f', stroke: '#fff', strokeWidth: 2, cursor: 'pointer', },
              },
              {
                tagName: 'text',
                selector: 'icon',
                textContent: '×',
                attrs: { fill: '#fff', fontSize: 15, fontWeight: 'bold', textAnchor: 'middle', dominantBaseline: 'central', pointerEvents: 'none', },
              },
            ],
            // On gère la suppression réelle dans ton code métier
            onClick: ({ view }: { view: any }) => { // On précise le type ici
              const edge = view.cell;
              // On utilise <any> pour éviter l'erreur sur getData
              const link = edge.getData ? (edge.getData() as any) : null;

              if (link && this.mcd) {
                // Suppression dans le tableau métier
                this.mcd.Links = this.mcd.Links.filter(l => l.id !== link.id);
              }

              // Suppression visuelle
              edge.remove();
              this.autoSave();
            },
          },
        },
      ]);
    });

    // ── Cacher le bouton quand la souris part ──────────────────────────────
    graph.on('edge:mouseleave', ({ edge }) => {
      edge.attr('line/stroke', '#334155');
      edge.attr('line/strokeWidth', 2);
      edge.removeTools();
    });

    // Écouter l'événement de suppression du nœud ---
    // On utilise { node }: any pour éviter l'erreur de binding
    graph.on('node:delete', ({ node }: { node: any }) => {
      // 1. Vérifications de sécurité (Stop les erreurs TS)
      if (!this.graph || !this.mcd) return;

      const data = node.getData();
      if (!data) return;

      const shape = node.getShape();

      // 2. Logique métier : supprimer du modèle
      if (shape === 'merise-entity') {
        this.mcd.Entities = this.mcd.Entities.filter(e => e.id !== data.id);
      } else if (shape === 'merise-assoc') {
        this.mcd.Associations = this.mcd.Associations.filter(a => a.id !== data.id);
      }

      // 3. Supprimer les liens rattachés (Fix de l'erreur Ln 588)
      const connectedEdges = this.graph.getConnectedEdges(node);
      if (connectedEdges) {
        connectedEdges.forEach(edge => {
          const link = edge.getData();
          if (link && this.mcd) {
            this.mcd.Links = this.mcd.Links.filter(l => l.id !== link.id);
          }
        });
      }

      // 4. Logique visuelle
      node.remove();
      this.autoSave();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Suppression : nettoyage du modèle MCD
  // ─────────────────────────────────────────────────────────────────────────────

  private removeNodeFromModel(node: Node): void {
    if (!this.mcd) return;
    const obj = node.getData<Entity | Association>();
    if (!obj) return;

    if (node.shape === 'merise-entity') {
      const e = obj as Entity;
      this.mcd.Entities = this.mcd.Entities.filter(x => x.id !== e.id);
      this.mcd.Links = this.mcd.Links.filter(l => l.entityId !== e.id);
    } else if (node.shape === 'merise-assoc') {
      const a = obj as Association;
      this.mcd.Associations = this.mcd.Associations.filter(x => x.id !== a.id);
      this.mcd.Links = this.mcd.Links.filter(l => l.assocId !== a.id);
    }
  }

  private removeEdgeFromModel(edge: Edge): void {
    if (!this.mcd) return;
    const link = edge.getData<Link>();
    if (!link) return;
    this.mcd.Links = this.mcd.Links.filter(l => l.id !== link.id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Dessin du MCD depuis le modèle (appelé après loadMcd)
  // ─────────────────────────────────────────────────────────────────────────────

  drawMcd(): void {
    if (!this.graph || !this.mcd) return;
    this.graph.clearCells();

    const nodeMap = new Map<string, Node>();

    // ── Entités ───────────────────────────────────────────────────────────────
    this.mcd.Entities.forEach(entity => {
      // 1. On crée le nœud avec ses propriétés de base uniquement
      const node = this.graph!.addNode({
        shape: 'merise-entity',
        x: entity.posX,
        y: entity.posY,
        width: entity.width,
        // On laisse updateNodeDisplay gérer la hauteur (height)
        data: entity,
        attrs: {
          label: { text: entity.name }
          // On ne met PAS 'fields-text' ici
        }
      });

      // 2. On appelle ton "Bunker" qui va nettoyer les [x] et calculer la taille
      this.updateNodeDisplay(node);

      nodeMap.set(entity.id, node);
    });

    // ── Associations ──────────────────────────────────────────────────────────
    this.mcd.Associations.forEach(assoc => {
      const node = this.graph!.addNode({
        shape: 'merise-assoc',
        x: assoc.posX,
        y: assoc.posY,
        width: assoc.width,
        height: assoc.height,
        data: assoc,
        attrs: {
          label: { text: assoc.name }
        }
      });
      nodeMap.set(assoc.id, node);
    });

    // ── Liens ─────────────────────────────────────────────────────────────────
    this.mcd.Links.forEach(link => {
      const src = nodeMap.get(link.assocId);
      const tgt = nodeMap.get(link.entityId);

      if (!src || !tgt) {
        console.warn(`[MCD] Lien orphelin ignoré : assocId=${link.assocId}, entityId=${link.entityId}`);
        return;
      }

      this.graph!.addEdge({
        source: src,
        target: tgt,
        data: link,
        labels: [{ attrs: { label: { text: link.cardinality } } }],
        attrs: {
          line: { stroke: '#334155', strokeWidth: 2, targetMarker: '', sourceMarker: '' }
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Gestion des champs (Fields)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Ajoute un champ à une entité ou association ET met à jour le nœud graphique.
   * Appeler cette méthode depuis le dictionnaire de données ou tout autre composant.
   *
   * @param targetId  L'id de l'Entity ou de l'Association cible
   * @param field     Le champ à ajouter
   */
  addFieldToNode(targetId: string, field: Field): void {
    if (!this.mcd || !this.graph) return;

    // Chercher dans les entités
    let businessObj: Entity | Association | undefined =
      this.mcd.Entities.find(e => e.id === targetId);

    // Sinon chercher dans les associations
    if (!businessObj) {
      businessObj = this.mcd.Associations.find(a => a.id === targetId);
    }

    if (!businessObj) {
      console.warn(`[MCD] addFieldToNode : aucun objet métier trouvé pour id=${targetId}`);
      return;
    }

    // 1. Mettre à jour le modèle métier
    businessObj.addField(field);

    // 2. Retrouver le nœud X6 correspondant et mettre à jour l'affichage des champs
    const node = this.graph.getNodes().find(n => n.getData()?.id === targetId);
    if (node) {
      this.updateNodeDisplay(node);
    }

    this.autoSave();
  }

  removeFieldFromEntity(node: any, index: number) {
    const data = node.getData();
    if (!data.fields) return;

    console.log("Suppression du champ index :", index);

    // 1. Mise à jour de la data locale au nœud
    data.fields.splice(index, 1);
    node.setData({ ...data }, { overwrite: true });

    // 2. Mise à jour du modèle global (MCD) pour la sauvegarde
    if (this.mcd) {
      const entity = this.mcd.Entities.find(e => e.id === data.id)
        || this.mcd.Associations.find(a => a.id === data.id);
      if (entity) {
        entity.fields = [...data.fields];
      }
    }

    // 3. Rafraîchissement visuel
    this.updateNodeDisplay(node);
    node.removeTools();
    this.autoSave();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Picker de champs (ouvert via bouton + sur un nœud)
  // ─────────────────────────────────────────────────────────────────────────────

  closePicker(): void {
    this.showPicker = false;
    this.pickerNode = null;
  }

  // Mise à jour quand on valide le picker
  onPickerSelectionChanged(selectedNames: string[]) {
    if (!this.pickerNode) return;

    const allFields = this.dictionaryService.load(this.slug);
    const newFields = selectedNames.map(name =>
      allFields.find(f => f.name === name) || new Field(Date.now().toString(), name, name, 'VARCHAR')
    );

    this.pickerNode.setData({ fields: newFields }, { overwrite: true });

    // Mise à jour visuelle propre (sans [x])
    this.updateNodeDisplay(this.pickerNode);
    this.autoSave();
  }



  // ─────────────────────────────────────────────────────────────────────────────
  // Drag & Drop depuis la palette
  // ─────────────────────────────────────────────────────────────────────────────

  startDrag(event: MouseEvent, type: 'entity' | 'association'): void {
    if (!this.graph || !this.dnd || !this.mcd) return;

    let newNode: Node;

    if (type === 'entity') {
      const entity = new Entity('ENTITE' + this.randomSuffix(), [], 0, 0, 160, 100);
      this.mcd.Entities.push(entity);

      newNode = this.graph.createNode({
        shape: 'merise-entity',
        width: 160,
        height: 100,
        data: entity,
        attrs: {
          label: { text: entity.name },
          'fields-text': { text: '' }
        }
      });

    } else {
      const assoc = new Association('ASSOC_' + this.randomSuffix(), [], 0, 0, 120, 60);
      this.mcd.Associations.push(assoc);

      newNode = this.graph.createNode({
        shape: 'merise-assoc',
        width: 120,
        height: 60,
        data: assoc,
        attrs: { label: { text: assoc.name } }
      });
    }

    // node:change:position se déclenchera après le drop et sync les coordonnées
    this.dnd.start(newNode, event);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Sauvegarde
  // ─────────────────────────────────────────────────────────────────────────────

  /** Sauvegarde manuelle (bouton "Enregistrer" dans le template) */
  triggerSave(): void {
    this.autoSave();
  }

  private autoSave(): void {
    if (this.mcd && this.slug) {
      this.mcdService.saveMcd(this.slug, this.mcd);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilitaires
  // ─────────────────────────────────────────────────────────────────────────────

  private randomSuffix(): string {
    return Math.floor(Math.random() * 1000).toString();
  }
}