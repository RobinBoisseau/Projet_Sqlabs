import {Component, OnInit, OnChanges, AfterViewInit, OnDestroy,Input, ViewChild, ElementRef, HostListener, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node, Edge } from '@antv/x6';
import { Subscription } from 'rxjs';

import { Mcd } from '../../models/mcd';
import { Entity } from '../../models/entity';
import { Association } from '../../models/association';
import { Link } from '../../models/link';
import { Field } from '../../models/field';

import { McdService } from '../../services/mcd.service';
import { TableService } from '../../services/table.service';
import { DictionaryService } from '../../services/dictionary.service';
import { McdCaretakerService } from '../../services/mcd-caretaker.service';
import { McdGraphService } from '../../services/mcd-graph.service';
import { McdNodeService } from '../../services/mcd-node.service';
import { McdEventsService, McdGraphCallbacks } from '../../services/mcd-events.service';

import { McdToolbarComponent } from './mcd-toolbar/mcd-toolbar.component';
import { McdPickerModalComponent } from './mcd-picker-modal/mcd-picker-modal.component';

@Component({
  selector: 'app-mcd-editor',
  standalone: true,
  imports: [CommonModule, McdToolbarComponent, McdPickerModalComponent],
  providers: [McdGraphService, McdNodeService, McdEventsService],
  templateUrl: './mcd-editor.component.html',
  styleUrls: ['./mcd-editor.component.css'],
})
export class McdEditorComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef;
  @Input() slug = '';
  @Input() mcd: Mcd | undefined;

  // State variables kept here so services can read/write them via callbacks
  connecting = false;
  isResizing = false;
  pendingDrops = new Map<string, Entity | Association>();
  isResettingGraph = false;
  resizingSaved = false;

  showPicker = false;
  pickerNode: Node | null = null;
  pickerCurrentNames: string[] = [];
  pickerAvailableNames: string[] = [];
  pickerNodeName = '';

  private pickerSub?: Subscription;
  private dictSub?: Subscription;

  constructor(
    private mcdService: McdService,
    private tableService: TableService,
    private dictionaryService: DictionaryService,
    public caretaker: McdCaretakerService,
    private graphService: McdGraphService,
    private nodeService: McdNodeService,
    private eventsService: McdEventsService,
  ) {}

  get graph() { return this.graphService.graph; }

  getGraphJson(): any { return this.graph?.toJSON() ?? null; }

  // ── Cycle de vie ──────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    const mcdChange = changes['mcd'];
    if (mcdChange?.currentValue) {
      const incoming: Mcd = mcdChange.currentValue;
      if (incoming.Entities.length > 0 || incoming.Associations.length > 0) {
        this.mcd = incoming;
        if (this.graph) this.drawMcd();
      }
    }
  }

  ngOnInit(): void {
    const savedMcd = this.mcdService.loadMcd(this.slug);
    if (savedMcd) this.mcd = savedMcd;

    // Sync node display with dictionary on load
    setTimeout(() => {
      const fields = this.dictionaryService.load(this.slug);
      if (fields.length > 0 && this.graph) {
        this.graph.getNodes().forEach(node => {
          const data = node.getData();
          if (!data?.fields) return;
          const updatedFields = data.fields
            .filter((f: any) => fields.some((df: any) => df.id === f.id))
            .map((f: any) => {
              const dictField = fields.find((df: any) => df.id === f.id);
              return dictField ? { ...f, TechnicalName: dictField.TechnicalName } : f;
            });
          node.setData({ ...data, fields: updatedFields }, { overwrite: true });
          this.nodeService.updateNodeDisplay(node);
        });
      }
    }, 200);

    this.pickerSub = this.tableService.openPicker$.subscribe(({ node, slug }) => {
      const activeSlug = slug || this.slug;
      const allFields = this.dictionaryService.load(activeSlug);
      const actualFields = node.getData().fields || [];
      this.pickerAvailableNames = allFields.map(f => f.TechnicalName);
      this.pickerCurrentNames   = actualFields.map((f: any) => f.TechnicalName);
      this.pickerNode     = node;
      this.pickerNodeName = node.attr('label/text') ?? '';
      this.showPicker     = true;
    });

    this.dictSub = this.dictionaryService.onUpdated$.subscribe(({ slug, fields }) => {
      if (slug !== this.slug || !this.graph) return;
      this.graph.getNodes().forEach(node => {
        const data = node.getData();
        if (!data?.fields) return;
        const updatedFields = data.fields
          .filter((f: any) => fields.some((df: any) => df.id === f.id))
          .map((f: any) => {
            const dictField = fields.find((df: any) => df.id === f.id);
            return dictField ? { ...f, TechnicalName: dictField.TechnicalName } : f;
          });
        node.setData({ ...data, fields: updatedFields }, { overwrite: true });
        this.nodeService.updateNodeDisplay(node);
      });
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.graphService.registerNodeShapes();
      const graph = this.graphService.initGraph(this.containerRef.nativeElement);

      const { clientWidth: w, clientHeight: h } = this.containerRef.nativeElement;
      if (w > 0 && h > 0) graph.resize(w, h);

      const callbacks: McdGraphCallbacks = {
        getMcd:              () => this.mcd,
        saveToHistory:       () => this.saveToHistory(),
        autoSave:            () => this.autoSave(),
        updateNodeDisplay:   (node) => this.nodeService.updateNodeDisplay(node, this.isResizing),
        removeNodeFromModel: (node) => { if (this.mcd) this.nodeService.removeNodeFromModel(node, this.mcd); },
        triggerPicker:       (node, fields, slug) => this.tableService.triggerPicker(node, fields, slug),
        getSlug:             () => this.slug,
        isConnecting:        () => this.connecting,
        setConnecting:       (v) => this.connecting = v,
        isResettingGraph:    () => this.isResettingGraph,
        getPendingDrops:     () => this.pendingDrops,
        isResizingSaved:     () => this.resizingSaved,
        setResizingSaved:    (v) => this.resizingSaved = v,
        setIsResizing:       (v) => this.isResizing = v,
        getIsResizing:       () => this.isResizing,
      };

      this.eventsService.bindGraphEvents(graph, callbacks);
      if (this.mcd) this.drawMcd();
    }, 100);
  }

  ngOnDestroy(): void {
    this.graphService.dispose();
    this.pickerSub?.unsubscribe();
    this.dictSub?.unsubscribe();
  }

  // ── Keyboard ─────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    const tag = (event.target as HTMLElement)?.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const selectedCells = this.graph?.getSelectedCells() ?? [];
    if (!selectedCells.length || !this.mcd) return;

    this.saveToHistory();
    selectedCells.forEach(cell => {
      if (cell.isNode()) this.nodeService.removeNodeFromModel(cell as Node, this.mcd!);
      else if (cell.isEdge()) this.removeEdgeFromModel(cell as Edge);
    });
    this.graph?.removeCells(selectedCells);
    this.autoSave();
  }

  // ── CtrlZ et CtrlY ─────────────────────────────────────────────────────

  @HostListener('document:keydown.control.z', ['$event'])
  onUndo(event?: KeyboardEvent): void {
    event?.preventDefault();
    if (!this.mcd || !this.caretaker.canUndo()) return;
    const previous = this.caretaker.undo(this.mcd);
    if (previous) { this.mcd = previous; this.drawMcd(); }
  }

  @HostListener('document:keydown.control.y', ['$event'])
  onRedo(event?: KeyboardEvent): void {
    event?.preventDefault();
    if (!this.mcd || !this.caretaker.canRedo()) return;
    const next = this.caretaker.redo(this.mcd);
    if (next) { this.mcd = next; this.drawMcd(); }
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  startDrag(event: MouseEvent, type: 'entity' | 'association'): void {
    const { graph, dnd } = this.graphService;
    if (!graph || !dnd || !this.mcd) return;

    if (type === 'entity') {
      const entity = new Entity('ENTITE' + this.randomSuffix(), [], 0, 0, 160, 100);
      this.pendingDrops.set(entity.id, entity);
      dnd.start(graph.createNode({
        shape: 'merise-entity', width: 160, height: 100,
        data: entity, attrs: { label: { text: entity.name }, 'fields-text': { text: '' } },
      }), event);
    } else {
      const assoc = new Association('ASSOC_' + this.randomSuffix(), [], 0, 0, 120, 60);
      this.pendingDrops.set(assoc.id, assoc);
      dnd.start(graph.createNode({
        shape: 'merise-assoc', width: 120, height: 60,
        data: assoc, attrs: { label: { text: assoc.name } },
      }), event);
    }
  }

  onToolbarDragStart(e: { event: MouseEvent; type: 'entity' | 'association' }): void {
    this.startDrag(e.event, e.type);
  }

  // ── Picker ─────────────────────────────────────────────────────────────────

  closePicker(): void {
    this.showPicker = false;
    this.pickerNode = null;
  }

  onPickerSelectionChanged(selectedNames: string[]): void {
    if (!this.pickerNode) return;
    const allFields = this.dictionaryService.load(this.slug);
    const newFields = selectedNames.map(name =>
      allFields.find(f => f.TechnicalName === name) || new Field(Date.now().toString(), name, name, 'VARCHAR')
    );

    // Mutate existing data object to preserve the reference to this.mcd
    const data = this.pickerNode.getData();
    if (data) {
      this.saveToHistory();
      data.fields = newFields;
      this.pickerNode.setData(data, { overwrite: true });
    }
    const obj = this.mcd?.Entities.find(e => e.id === data.id) || this.mcd?.Associations.find(a => a.id === data.id);
    if (obj) obj.fields = newFields;

    this.nodeService.updateNodeDisplay(this.pickerNode);
    this.autoSave();
  }

  // ── Draw ───────────────────────────────────────────────────────────────────

  drawMcd(): void {
    const graph = this.graphService.graph;
    if (!graph || !this.mcd) return;

    this.isResettingGraph = true;
    graph.clearCells();
    this.isResettingGraph = false;

    // Remove duplicates (guard against corrupted state)
    this.mcd.Entities     = [...new Map(this.mcd.Entities.map(e => [e.id, e])).values()];
    this.mcd.Associations = [...new Map(this.mcd.Associations.map(a => [a.id, a])).values()];
    this.mcd.Links        = [...new Map(this.mcd.Links.map(l => [l.id, l])).values()];

    const nodeMap = new Map<string, Node>();

    this.mcd.Entities.forEach(entity => {
      const node = graph.addNode({
        shape: 'merise-entity',
        x: entity.posX, y: entity.posY, width: entity.width, height: entity.height,
        data: entity, attrs: { label: { text: entity.name } },
      });
      this.nodeService.updateNodeDisplay(node);
      nodeMap.set(entity.id, node);
    });

    this.mcd.Associations.forEach(assoc => {
      const node = graph.addNode({
        shape: 'merise-assoc',
        x: assoc.posX, y: assoc.posY, width: assoc.width, height: assoc.height,
        data: assoc, attrs: { label: { text: assoc.name } },
      });
      this.nodeService.updateNodeDisplay(node);
      nodeMap.set(assoc.id, node);
    });

    this.mcd.Links.forEach(link => {
      const src = nodeMap.get(link.assocId);
      const tgt = nodeMap.get(link.entityId);
      if (!src || !tgt) {
        console.warn(`[MCD] Lien orphelin ignoré : assocId=${link.assocId}, entityId=${link.entityId}`);
        return;
      }
      graph.addEdge({
        source: src, target: tgt, data: link,
        labels: [{ attrs: { label: { text: link.cardinality } } }],
        attrs: { line: { stroke: '#334155', strokeWidth: 2, targetMarker: '', sourceMarker: '' } },
      });
    });
  }

  // ── Sauvegarde / Historique ─────────────────────────────────────────────────────────

  triggerSave(): void { this.autoSave(); }

  addFieldToNode(targetId: string, field: Field): void {
    if (!this.mcd || !this.graph) return;
    this.nodeService.addFieldToNode(targetId, field, this.mcd, this.graph);
    this.autoSave();
  }

  private autoSave(): void {
    if (this.mcd && this.slug) this.mcdService.saveMcd(this.slug, this.mcd);
  }

  private saveToHistory(): void {
    if (this.mcd) this.caretaker.save(this.mcd);
  }

  private removeEdgeFromModel(edge: Edge): void {
    if (!this.mcd) return;
    const link = edge.getData<Link>();
    if (!link) return;
    this.mcd.Links = this.mcd.Links.filter(l => l.id !== link.id);
  }

  private randomSuffix(): string {
    return Math.floor(Math.random() * 1000).toString();
  }
}
