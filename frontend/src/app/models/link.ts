export const MERISE_CARDINALITIES = ['1,1', '1,N', '0,N', '0,1'] as const;

export class Link {
  /** Identifiant unique du lien */
  public id: string;
 
  constructor(
    /** La cardinalité du lien (ex: "1,N", "0,1") */
    public cardinality: string = '',
    /** ID de l'Association source */
    public assocId: string = '',
    /** ID de l'Entité cible */
    public entityId: string = '',
    id?: string
  ) {
    this.id = id ?? Link.generateId();
  }
 
  private static generateId(): string {
    return 'lnk_' + Math.random().toString(36).substring(2, 10);
  }
 
  modifyCardinality(cardinality: string): void {
    this.cardinality = cardinality;
  }
 
  static fromJSON(data: any): Link {
    return new Link(
      data.cardinality ?? '',
      data.assocId ?? '',
      data.entityId ?? '',
      data.id
    );
  }
}