import { Champs } from './champs';

export class Entities {
    constructor(
        public id:number =1,
        public name: string = "Etudiant",
        public taille : number = 10,
        public x : number = 5,
        public y : number = 15,
        public fields: Champs[] = []
    ){}
}

