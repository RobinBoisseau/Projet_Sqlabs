
export class Field {
  constructor(
    public id: string = '',
    public name: string = '',
    public TechnicalName: string = '',
    public Type: string = '',
    public PrimaryKey: boolean = false
  ) {}
 
  underline(): string {
    return this.PrimaryKey ? `<u>${this.name}</u>` : this.name;
  }
 
  static fromJSON(data: any): Field {
    return new Field(
      data.id,
      data.name,
      data.TechnicalName,
      data.Type,
      data.PrimaryKey
    );
  }
}
 
