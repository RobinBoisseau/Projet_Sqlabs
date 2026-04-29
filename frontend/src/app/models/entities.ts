import { Champs } from './champs';

export class Entities {
    constructor(
        public id:number =1,
        public name: string = "Etudiant",
        public taille : number = 10,
        public positionX : number = 5,
        public positionY : number = 15,
        public feels: Champs[] = []
    ){}
}

