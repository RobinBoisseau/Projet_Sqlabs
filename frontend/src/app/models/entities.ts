import { Champs } from './champs';

export class Entities {
    constructor(
        public id: number = 1,
        public name: string = "Etudiant",
        public width: number = 140,
        public height: number = 100,
        public member_x: number = 5,
        public member_y: number = 15,
        public fields: Champs[] = [],
        public type: string = ""
    ){}

    static fromJSON(data: any): Entities {
        const entite = new Entities(
            data.id,
            data.name,
            data.width,
            data.height,
            data.member_x,
            data.member_y,
            [],
            data.type || ""
        );
        if (data.fields && Array.isArray(data.fields)) {
            entite.fields = data.fields.map((f: any) => Champs.fromJSON(f));
        }
        return entite;
    }
}