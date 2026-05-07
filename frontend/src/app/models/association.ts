import { ElementSchema } from './element-schema';
import { Field } from './field';

export class Association extends ElementSchema {
  /** Identifiant unique stable généré à la création, préservé à la désérialisation. */
  public id: string;

  constructor(
    public name: string = '',
    public fields: Field[] = [],
    posX: number = 50,
    posY: number = 50,
    width: number = 120,
    height: number = 60,
    id?: string
  ) {
    super(posX, posY, width, height);
    this.id = id ?? Association.generateId();
  }

  private static generateId(): string {
    return 'asc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }

  addField(field: Field): void {
    this.fields.push(field);
  }

  deleteField(field: Field): void {
    const index = this.fields.indexOf(field);
    if (index !== -1) this.fields.splice(index, 1);
  }

  renameNewName(newName: string): void {
    this.name = newName;
  }

  ElementSchema(): this {
    return this;
  }

  cloneElementSchema(): this {
    return new Association(
      this.name,
      this.fields.map(f => Field.fromJSON(f)),
      this.posX,
      this.posY,
      this.width,
      this.height,
      this.id
    ) as this;
  }

  static fromJSON(data: any): Association {
    const fields: Field[] = Array.isArray(data.fields)
      ? data.fields.map((f: any) => Field.fromJSON(f))
      : [];

    return new Association(
      data.name ?? 'ASSOC',
      fields,
      typeof data.posX === 'number' ? data.posX : 50,
      typeof data.posY === 'number' ? data.posY : 50,
      typeof data.width === 'number' ? data.width : 120,
      typeof data.height === 'number' ? data.height : 60,
      data.id
    );
  }
}