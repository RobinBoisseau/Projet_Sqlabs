import { Entity } from './entity';
import { Association } from './association';
import { Link } from './link';
import { Dependence } from './dependence.model';

export class Mcd {
  constructor(
    public Entities: Entity[] = [],
    public Associations: Association[] = [],
    public Links: Link[] = [],
    public dependence: Dependence = new Dependence()
  ) { }

  save(): string {
    return JSON.stringify(this);
  }

  static fromJSON(data: any): Mcd {
    const entities = data.Entities?.map((e: any) => Entity.fromJSON(e)) ?? [];
    const associations = data.Associations?.map((a: any) => Association.fromJSON(a)) ?? [];
    const links = data.Links?.map((l: any) => Link.fromJSON(l)) ?? [];
    const dep = data.dependence ? Dependence.fromJSON(data.dependence) : new Dependence();

    return new Mcd(entities, associations, links, dep);
  }
}