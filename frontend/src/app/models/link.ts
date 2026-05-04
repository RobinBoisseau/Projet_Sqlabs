
import { ElementSchema } from './element-schema';
import { Point } from './point';
import { Entity } from './entity';
 
export class Link extends ElementSchema {
  constructor(
    public cardinality: string = '',
    public anchoringEntity: Point = new Point(),
    public anchoringAssoc: Point = new Point(),
    public posCardinalityX: number = 0,
    public posCardinalityY: number = 0,
    public pointsIntermediate: Point[] = [],
    /** Référence vers l'entité pointée */
    public pointsTo: Entity | null = null,
    posX: number = 0,
    posY: number = 0,
    width: number = 0,
    height: number = 0
  ) {
    super(posX, posY, width, height);
  }
 
  modifyCardinality(cardinality: string): void {
    this.cardinality = cardinality;
  }
 
  moveCardinality(x: number, y: number): void {
    this.posCardinalityX = x;
    this.posCardinalityY = y;
  }
 
  ElementSchema(): this {
    return this;
  }
 
  cloneElementSchema(): this {
    const clone = new Link(
      this.cardinality,
      Point.fromJSON(this.anchoringEntity),
      Point.fromJSON(this.anchoringAssoc),
      this.posCardinalityX,
      this.posCardinalityY,
      this.pointsIntermediate.map(p => Point.fromJSON(p)),
      this.pointsTo,
      this.posX,
      this.posY,
      this.width,
      this.height
    );
    return clone as this;
  }
 
  static fromJSON(data: any): Link {
    return new Link(
      data.cardinality,
      data.anchoringEntity ? Point.fromJSON(data.anchoringEntity) : new Point(),
      data.anchoringAssoc ? Point.fromJSON(data.anchoringAssoc) : new Point(),
      data.posCardinalityX,
      data.posCardinalityY,
      data.pointsIntermediate ? data.pointsIntermediate.map((p: any) => Point.fromJSON(p)) : [],
      null, // pointsTo est résolu après désérialisation
      data.posX,
      data.posY,
      data.width,
      data.height
    );
  }
}
