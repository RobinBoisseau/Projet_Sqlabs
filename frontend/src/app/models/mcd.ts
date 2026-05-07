import { Entity } from './entity';
import { Association } from './association';
import { Link } from './link';
 
/**
 * Modèle racine du Modèle Conceptuel de Données (MCD).
 * Contient toutes les entités, associations et liens.
 */
export class Mcd {
  constructor(
    public Entities: Entity[] = [],
    public Associations: Association[] = [],
    public Links: Link[] = []
  ) {}
 
  /**
   * Sérialise le MCD en JSON string.
   * Les IDs dans les Links permettent de retrouver les objets après désérialisation.
   */
  save(): string {
    return JSON.stringify(this);
  }
 
  /**
   * Reconstruit un Mcd complet depuis du JSON brut (localStorage).
   * Les fromJSON de chaque modèle préservent les IDs pour maintenir la cohérence des liens.
   */
  static fromJSON(data: any): Mcd {
    const entities = data.Entities?.map((e: any) => Entity.fromJSON(e)) ?? [];
    const associations = data.Associations?.map((a: any) => Association.fromJSON(a)) ?? [];
    const links = data.Links?.map((l: any) => Link.fromJSON(l)) ?? [];
    return new Mcd(entities, associations, links);
  }
}
