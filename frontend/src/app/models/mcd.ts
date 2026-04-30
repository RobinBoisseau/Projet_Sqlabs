import { Entities } from './entities';
import { Association } from './associations';

export class Mcd {
    constructor(
        public Entities: Entities[] = [],
        public Association: Association[] = []
    ){}

    static fromJSON(data: any): Mcd {
        // On transforme chaque entité brute en vraie classe Entities
        const entitiesList = data.Entities 
            ? data.Entities.map((e: any) => Entities.fromJSON(e)) 
            : [];

        // On transforme chaque association brute en vraie classe Association
        const associationsList = data.Association 
            ? data.Association.map((a: any) => Association.fromJSON(a)) 
            : [];

        return new Mcd(
            entitiesList,
            associationsList
        );
    }
}