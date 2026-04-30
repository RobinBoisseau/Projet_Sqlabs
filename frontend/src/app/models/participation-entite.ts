export class ParticipationEntite {
    constructor(
        public entityId: number = 0,
        public minCardinality: string = '0',
        public maxCardinality: string = 'N',
        public entityAnchorX: number = 0.5,
        public entityAnchorY: number = 0.5,
        public associationAnchorX: number = 0.5,
        public associationAnchorY: number = 0.5
    ) {}

    static fromJSON(data: any): ParticipationEntite {
        return new ParticipationEntite(
            data.entityId,
            data.minCardinality,
            data.maxCardinality,
            data.entityAnchorX,
            data.entityAnchorY,
            data.associationAnchorX,
            data.associationAnchorY
        );
    }
}