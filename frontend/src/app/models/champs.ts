export class Champs {
    constructor(
        public id: number = 1,
        public name: string = "Prenom",
        public type: string = "String",
        public isPrimaryKey: boolean = false
    ) {}

    static fromJSON(data: any): Champs {
        return new Champs(
            data.id,
            data.name,
            data.type,
            data.isPrimaryKey
        );
    }
}