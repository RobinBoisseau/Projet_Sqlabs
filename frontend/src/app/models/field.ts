
export class Field {
  constructor(
    public id: string = '',
    public name: string = '',
    public TechnicalName: string = '',
    public Type: string = '',
  ) {}
 
  static fromJSON(data: any): Field {
    return new Field(
      data.id,
      data.name,
      data.TechnicalName,
      data.Type,
    );
  }
}
 
