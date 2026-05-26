import { Injectable } from '@angular/core';
import { Node, Graph } from '@antv/x6';
import { Mcd } from '../models/mcd';
import { Entity } from '../models/entity';
import { Association } from '../models/association';
import { Field } from '../models/field';

const LINE_HEIGHT = 22;
const START_Y = 35;

@Injectable()
export class McdNodeService {

  updateNodeDisplay(node: any, isResizing = false): void {
    const data = node.getData();
    const fields: any[] = data.fields || [];
    const hasFields = fields.length > 0;

    if (node.shape === 'merise-assoc') {
      const fieldsContent = fields.map((f: any) => f.TechnicalName).join('          ');
      const baseWidth = 120;
      const dynamicWidth = hasFields
        ? Math.max(baseWidth, fields.reduce((acc: number, f: any) => acc + (f.TechnicalName.length * 7), 40))
        : baseWidth;

      node.resize(dynamicWidth, 80);
      node.setAttrs({
        label: { refX: '50%', refY: hasFields ? '35%' : '50%', textVerticalAnchor: 'middle' },
        separator: { display: 'none' },
        'fields-text': {
          text: fieldsContent,
          refX: '50%', refY: 40,
          lineHeight: LINE_HEIGHT,
          textVerticalAnchor: 'top', textAnchor: 'middle',
          display: hasFields ? 'block' : 'none',
        },
      });
    } else {
      const { width, height } = node.getSize();
      const maxChars = Math.floor((width - 20) / 6.5);

      const maxVisibleFields = Math.max(0, Math.floor((height - START_Y - 10) / LINE_HEIGHT));

      // Tronque les champs selon la hauteur ET la largeur
      const visibleFields = fields.slice(0, maxVisibleFields);

      const fieldsContent = visibleFields
        .map((f: any) => {
          const line = `${f.PrimaryKey ? '#' : '-'} ${f.TechnicalName}`;
          return line.length > maxChars ? line.substring(0, maxChars) + '…' : line;
        })
        .join('\n');

      const separatorPath = visibleFields
        .map((_: any, i: number) => {
          if (i === 0) return null;
          const y = START_Y + (i * LINE_HEIGHT);
          return `M 0 ${y} L ${width} ${y}`;
        })
        .filter((p): p is string => p !== null)
        .join(' ');

      node.setAttrs({
        'field-separators': { d: separatorPath, stroke: '#1890ff', strokeWidth: 1, display: visibleFields.length > 0 ? 'block' : 'none' },
        'fields-text': { text: fieldsContent, lineHeight: LINE_HEIGHT, refY: START_Y + 5, refWidth: '95%', textVerticalAnchor: 'top', fontSize: 12, fill: '#334155' },
      });

      if (hasFields && !isResizing) {
        const dynamicHeight = START_Y + (fields.length * LINE_HEIGHT) + 10;
        node.resize(width, Math.max(dynamicHeight, 60));
      }
    }
  }

  removeNodeFromModel(node: Node, mcd: Mcd): void {
    const obj = node.getData<Entity | Association>();
    if (!obj) return;

    if (node.shape === 'merise-entity') {
      const e = obj as Entity;
      mcd.Entities = mcd.Entities.filter(x => x.id !== e.id);
      mcd.Links = mcd.Links.filter(l => l.entityId !== e.id);
    } else if (node.shape === 'merise-assoc') {
      const a = obj as Association;
      mcd.Associations = mcd.Associations.filter(x => x.id !== a.id);
      mcd.Links = mcd.Links.filter(l => l.assocId !== a.id);
    }
  }

  addFieldToNode(targetId: string, field: Field, mcd: Mcd, graph: Graph): void {
    const businessObj: Entity | Association | undefined =
      mcd.Entities.find(e => e.id === targetId) ||
      mcd.Associations.find(a => a.id === targetId);

    if (!businessObj) {
      console.warn(`[MCD] addFieldToNode : aucun objet métier trouvé pour id=${targetId}`);
      return;
    }

    businessObj.addField(field);

    const node = graph.getNodes().find(n => n.getData()?.id === targetId);
    if (node) this.updateNodeDisplay(node);
  }

  removeFieldFromEntity(node: any, index: number, mcd: Mcd | undefined, saveToHistory: () => void, autoSave: () => void): void {
    const data = node.getData();
    if (!data.fields) return;

    saveToHistory();
    data.fields.splice(index, 1);
    node.setData({ ...data }, { overwrite: true });

    if (mcd) {
      const obj = mcd.Entities.find(e => e.id === data.id) || mcd.Associations.find(a => a.id === data.id);
      if (obj) obj.fields = [...data.fields];
    }

    this.updateNodeDisplay(node);
    node.removeTools();
    autoSave();
  }
}
