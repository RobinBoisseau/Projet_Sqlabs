import { DependenceLine } from './dependence-line.model';
 
export class Dependence {
  constructor(
    public lines: DependenceLine[] = []
  ) {}
 
  generateJSON(): string {
    return JSON.stringify(this.lines);
  }
 
  static fromJSON(data: any): Dependence {
    const lines = data.lines ? data.lines.map((l: any) => DependenceLine.fromJSON(l)) : [];
    return new Dependence(lines);
  }
}
 
