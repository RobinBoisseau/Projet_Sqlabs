import { ElementSchema } from './element-schema';
import { Field } from './field';

export class Association extends ElementSchema {
  constructor(
    public name: string = '',
    public fields: Field[] = [],
    posX: number = 0,
    posY: number = 0,
    width: number = 100,
    height: number = 100
  ) {
    super(posX, posY, width, height);
  }

  addField(field: Field): void {
    this.fields.push(field);
  }

  deleteField(field: Field): void {
    const index = this.fields.indexOf(field);
    if (index !== -1) {
      this.fields.splice(index, 1);
    }
  }

  renameNewName(newName: string): void {
    this.name = newName;
  }

  ElementSchema(): this {
    return this;
  }

  cloneElementSchema(): this {
    const clone = new Association(
      this.name,
      this.fields.map(f => Field.fromJSON(f)),
      this.posX,
      this.posY,
      this.width,
      this.height
    );
    return clone as this;
  }

  static fromJSON(data: any): Association {
    const fields = data.fields ? data.fields.map((f: any) => Field.fromJSON(f)) : [];
    return new Association(
      data.name,
      fields,
      data.posX,
      data.posY,
      data.width,
      data.height
    );
  }
}