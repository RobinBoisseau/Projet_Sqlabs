import { Field } from './field';
 
export class Dictionary {
  constructor(
    public lines: Field[] = []
  ) {}
 
  generateJSON(): string {
    return JSON.stringify(this.lines);
  }
 
  static fromJSON(data: any): Dictionary {
    const lines = data.lines ? data.lines.map((f: any) => Field.fromJSON(f)) : [];
    return new Dictionary(lines);
  }
}
 
