import { ElementSchema } from './element-schema';
import { Field } from './field';

/**
 * Représente une Entité Merise dans le MCD.
 *
 * Corrections appliquées :
 * - Ajout d'un `id` stable et unique (préservé par fromJSON) pour que les
 *   Links puissent référencer les entités par ID après désérialisation.
 * - `fromJSON` mappe explicitement posX, posY, width, height avec des
 *   valeurs par défaut sensées (non-zéro) pour éviter le bug "tout en 0,0".
 */
export class Entity extends ElementSchema {
  /** Identifiant unique stable généré à la création, préservé à la désérialisation. */
  public id: string;

  constructor(
    public name: string = '',
    public fields: Field[] = [],
    posX: number = 50,
    posY: number = 50,
    width: number = 160,
    height: number = 100,
    id?: string
  ) {
    super(posX, posY, width, height);
    this.id = id ?? Entity.generateId();
  }

  private static generateId(): string {
    return 'ent_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }

  addField(field: Field): void {
    this.fields.push(field);
  }

  renameNewName(newName: string): void {
    this.name = newName;
  }

  deleteField(field: Field): void {
    const index = this.fields.indexOf(field);
    if (index !== -1) this.fields.splice(index, 1);
  }

  ElementSchema(): this {
    return this;
  }

  cloneElementSchema(): this {
    return new Entity(
      this.name,
      this.fields.map(f => Field.fromJSON(f)),
      this.posX,
      this.posY,
      this.width,
      this.height,
      this.id
    ) as this;
  }

  /**
   * Désérialise une Entity depuis le JSON du localStorage.
   *
   * CRITIQUE : on lit explicitement data.posX / data.posY / data.width / data.height.
   * Sans ça, les nœuds s'empilent en (0,0) au refresh car ElementSchema ne
   * serait pas initialisé avec les bonnes coordonnées.
   */
  static fromJSON(data: any): Entity {
    const fields: Field[] = Array.isArray(data.fields)
      ? data.fields.map((f: any) => Field.fromJSON(f))
      : [];

    return new Entity(
      data.name ?? 'ENTITE',
      fields,
      typeof data.posX === 'number' ? data.posX : 50,
      typeof data.posY === 'number' ? data.posY : 50,
      typeof data.width === 'number' ? data.width : 160,
      typeof data.height === 'number' ? data.height : 100,
      data.id
    );
  }
}