import { Champs } from './champs';

export class Entities {
    constructor(
        public id:number =1,
        public name: string = "Etudiant",
        public  largeur: number = 10,
        public hauteur: number = 10,
        public x : number = 5,
        public y : number = 15,
        public fields: Champs[] = []
    ){}

    static fromJSON(data: any): Entities {
        return new Entities(
            data.id,
            data.name,
            data.largeur,
            data.hauteur,
            data.x,
            data.y,
            data.fields
        );
    }
}

