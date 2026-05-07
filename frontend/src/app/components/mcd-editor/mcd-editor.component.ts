import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Graph, Node, Edge } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Transform } from '@antv/x6-plugin-transform';

import { Mcd } from '../../models/mcd';
import { Entity } from '../../models/entity';
import { Association } from '../../models/association';
import { Link, MERISE_CARDINALITIES } from '../../models/link';
import { Field } from '../../models/field';
import { McdService } from '../../services/mcd.service';
import { ToolButtonComponent } from '../toll-button/toll-button.component';

// ─── Configuration des ports réutilisable ────────────────────────────────────

/**
 * Groupes de ports cardinaux (N/S/E/O) partagés par Entités et Associations.
 *
 * RÈGLE MERISE :
 *   - Sur les Entités  → magnet: false  (on ne peut PAS partir d'une entité)
 *   - Sur les Assocs   → magnet: true   (seule source de lien autorisée)
 *
 * Les ports sont invisibles par défaut et n'apparaissent qu'au survol du nœud
 * grâce aux attrs.circle.style.visibility contrôlé via connected:highlight.
 */
const ENTITY_PORTS = {
  groups: {
    top: { position: 'top', attrs: { circle: { r: 4, magnet: 'passive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
    bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: 'pasive', stroke: '#1890ff', style: { visibility: 'hidden' } } } },
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Cycle de vie
  // ─────────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // 1. Charger le MCD depuis le localStorage.
    //    fromJSON des modèles préserve posX/posY/id
    const savedMcd = this.mcdService.loadMcd(this.slug);
    if (savedMcd) this.mcd = savedMcd;

    // 2. Le DOM doit être stable avant d'instancier X6
    setTimeout(() => {
      this.initGraph();
      if (this.mcd) this.drawMcd();
    }, 100);
  }

  ngOnDestroy(): void {
    this.graph?.dispose();
  }

  ngAfterViewInit(): void {
    // On attend un micro-délai pour être sûr que le DOM est prêt
    setTimeout(() => {
      if (this.graph) {
        this.graph.clearCells();

        // On force le graphe à recalculer sa taille
        const width = document.getElementById('container')?.clientWidth || 800;
        const height = document.getElementById('container')?.clientHeight || 600;
        this.graph.resize(width, height);
      }
    }, 100);
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

      // ── Affichage des ports au survol ────────────────────────────────────────

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
        validateConnection({ sourceMagnet, sourceView, targetView }) {
          // La source doit être un port magnet (Association uniquement)
          if (!sourceMagnet) return false;

          if (!sourceView || !targetView) return false;

          const sourceNode = sourceView.cell as Node;
          const targetNode = targetView.cell as Node;

          if (!sourceNode?.isNode() || !targetNode?.isNode()) return false;

          // Interdire : Association → Association
          if (sourceNode.shape === 'merise-assoc' && targetNode.shape === 'merise-assoc') return false;

          // Interdire : Entité → n'importe quoi (magnet: false sur entités, mais double sécurité)
          if (sourceNode.shape === 'merise-entity') return false;

          // Autoriser uniquement : Association → Entité
          return targetNode.shape === 'merise-entity';
        },

        createEdge() {
          return this.createEdge({
            shape: 'edge',
            attrs: {
              line: {
                stroke: '#334155',
                strokeWidth: 2,
                targetMarker: null  // Pas de flèche : lien Merise non-directionnel
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
      showNodeSelectionBox: false, // On l'a déjà dit, mais assure-toi que c'est bien là
      pointerEvents: 'none',
    }));

    this.graph.use(new Transform({
      resizing: {
        enabled: true,
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

    this.dnd = new Dnd({ target: this.graph });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Formes personnalisées AntV X6
  // ─────────────────────────────────────────────────────────────────────────────

  private registerNodeShapes(): void {

    /**
     * ENTITÉ MERISE
     * - Rectangle avec en-tête sombre + zone de champs scrollable
     * - Ports cardinaux avec magnet: FALSE → impossible de partir d'une entité
     * - markup étendu : 'fields-text' affiche les Field[] de l'objet métier
     */
    Graph.registerNode('merise-entity', {
      inherit: 'rect',
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'header' },
        { tagName: 'text', selector: 'label' },
        { tagName: 'line', selector: 'divider' },
        { tagName: 'text', selector: 'fields-text' },
      ],
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          fill: '#ffffff',
          stroke: '#0061d5',
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          magnet: true,
        },
        header: {
          refWidth: '100%',
          height: 28,
          fill: '#0061d5',
          rx: 8,
          ry: 8,
          stroke: 'none',
        },
        label: {
          refX: '50%',
          refY: 14,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#ffffff',
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
        },
        divider: {
          refX1: 0,
          refX2: '100%',
          refY1: 28,
          refY2: 28,
          stroke: '#cbd5e1',
          strokeWidth: 1,
        },
        'fields-text': {
          refX: 8,
          refY: 36,
          fill: '#334155',
          fontSize: 11,
          fontFamily: 'system-ui, sans-serif',
          // Le texte multi-lignes sera injecté via node.setAttrByPath()
          text: '',
        }
      },
      ports: ENTITY_PORTS
    }, true);

    /**
     * ASSOCIATION MERISE
     * - Ellipse avec bordure ambre
     * - Ports cardinaux avec magnet: TRUE → SEULE source de lien autorisée
     */
    Graph.registerNode('merise-assoc', {
      inherit: 'ellipse',
      markup: [
        { tagName: 'ellipse', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: {
          refCx: '50%',
          refCy: '50%',
          refRx: '50%',
          refRy: '50%',
          fill: '#fffbeb',
          stroke: '#f59e0b',
          strokeWidth: 2,
          magnet: true,
        },
        label: {
          refX: '50%',
          refY: '50%',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#92400e',
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
        }
      },
      ports: ASSOC_PORTS
    }, true);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Affichage des ports au survol
  // ─────────────────────────────────────────────────────────────────────────────

  private bindGraphEvents(): void {
    if (!this.graph) return;

    // GESTION DES PORTS (Hover)
    this.graph.on('node:mouseenter', ({ node }) => {
      node.getPorts().forEach(port => {
        node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
      });
    });

    this.graph.on('node:mouseleave', ({ node }) => {
      node.getPorts().forEach(port => {
        node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden');
      });
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

    this.graph.on('node:change:position', syncGeometry);
    this.graph.on('node:resized', syncGeometry);

    // RENOMMER UN NŒUD (Double-clic)
    this.graph.on('node:dblclick', ({ node }) => {
      const obj = node.getData<Entity | Association>();
      if (!obj) return;

      const newName = prompt('Renommer :', obj.name);
      if (newName === null || newName.trim() === '') return;

      obj.renameNewName(newName.trim());
      node.setAttrByPath('label/text', newName.trim());
      this.autoSave();
    });

    // CHANGER CARDINALITÉ (Clic simple sur le lien)
    this.graph.on('edge:click', ({ edge, e }) => {
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

    // CRÉATION DU LIEN (Association -> Entité)
    this.graph.on('edge:connected', ({ edge }) => {
      if (!this.mcd) return;

      const sourceNode = edge.getSourceNode();
      const targetNode = edge.getTargetNode();

      // Sécurité si on lâche le lien dans le vide
      if (!sourceNode || !targetNode) {
        this.graph?.removeEdge(edge);
        return;
      }

      const assoc = sourceNode.getData<Association>();
      const entity = targetNode.getData<Entity>();

      // Vérification de la validité de la connexion
      if (!assoc?.id || !entity?.id) {
        this.graph?.removeEdge(edge);
        return;
      }

      edge.attr({
        line: {
          stroke: '#334155', // Gris sombre
          strokeWidth: 2,
          targetMarker: { name: 'classic', size: 8, fill: '#334155' },
        },
      });


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

    // ── Afficher le bouton de suppression au survol du lien ─────────────────
    this.graph.on('edge:mouseenter', ({ edge }) => {
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
    this.graph.on('edge:mouseleave', ({ edge }) => {
      edge.attr('line/stroke', '#334155');
      edge.attr('line/strokeWidth', 2);
      edge.removeTools();
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
      const node = this.graph!.addNode({
        shape: 'merise-entity',
        x: entity.posX,
        y: entity.posY,
        width: entity.width,
        height: entity.height,
        data: entity,
        attrs: {
          label: { text: entity.name },
          'fields-text': { text: this.formatFields(entity.fields) }
        }
      });
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
          line: { stroke: '#334155', strokeWidth: 2, targetMarker: null }
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
      node.setAttrByPath('fields-text/text', this.formatFields(businessObj.fields));

      // Agrandir automatiquement le nœud si besoin (28px header + 16px/field)
      const neededHeight = 28 + 8 + businessObj.fields.length * 16 + 8;
      const { height } = node.getSize();
      if (neededHeight > height) {
        node.setSize({ width: node.getSize().width, height: neededHeight });
      }
    }

    this.autoSave();
  }

  /**
   * Formate la liste de champs en texte SVG multi-lignes simulé.
   * Chaque champ est préfixé par '# ' si c'est une clé primaire, sinon '- '.
   */
  private formatFields(fields: Field[]): string {
    if (!fields?.length) return '';
    return fields
      .map(f => `${f.PrimaryKey ? '#' : '-'} ${f.name} : ${f.Type ?? ''}`)
      .join('\n');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Drag & Drop depuis la palette
  // ─────────────────────────────────────────────────────────────────────────────

  startDrag(event: MouseEvent, type: 'entity' | 'association'): void {
    if (!this.graph || !this.dnd || !this.mcd) return;

    let newNode: Node;

    if (type === 'entity') {
      const entity = new Entity('ENTITE_' + this.randomSuffix(), [], 0, 0, 160, 100);
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