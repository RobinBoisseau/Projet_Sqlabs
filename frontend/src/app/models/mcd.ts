import { Entity } from './entity';
import { Association } from './association';
import { Link } from './link';

export class Mcd {
  constructor(
    public Entities: Entity[] = [],
    public Associations: Association[] = [],
    public Links: Link[] = []
  ) {}

  save(): string {
    return JSON.stringify(this);
  }

  static fromJSON(data: any): Mcd {
    const entitiesList: Entity[] = data.Entities
      ? data.Entities.map((e: any) => Entity.fromJSON(e))
      : [];

    const associationsList: Association[] = data.Associations
      ? data.Associations.map((a: any) => Association.fromJSON(a))
      : [];

    const linksList: Link[] = data.Links
      ? data.Links.map((l: any) => Link.fromJSON(l))
      : [];

    return new Mcd(entitiesList, associationsList, linksList);
  }
}