export class DependenceLine {
  constructor(
    public id: string = '',
    public source: string = '',
    public cible: string[] = []
  ) {}
 
  static fromJSON(data: any): DependenceLine {
    return new DependenceLine(
      data.id,
      data.source,
      data.cible ?? []
    );
  }
}
