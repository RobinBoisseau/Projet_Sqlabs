import { Champs } from './champs';

export class Entities {
    constructor(
        public id: number = 1,
        public name: string = "Etudiant",
        public largeur: number = 140,
        public hauteur: number = 100,
        public x: number = 5,
        public y: number = 15,
        public fields: Champs[] = [],
        public type: string = "" // Propriété ajoutée
    ){}

    static fromJSON(data: any): Entities {
        const entite = new Entities(
            data.id,
            data.name,
            data.largeur,
            data.hauteur,
            data.x,
            data.y,
            [],
            data.type || ""
        );
        if (data.fields && Array.isArray(data.fields)) {
            entite.fields = data.fields.map((f: any) => Champs.fromJSON(f));
        }
        return entite;
    }
}