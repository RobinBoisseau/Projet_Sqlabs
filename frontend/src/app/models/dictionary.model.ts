import { Field } from './field';

export class Dictionary {
  constructor(public lines: Field[] = []) {}

  // Transforme tout le dictionnaire en chaîne JSON
  generateJSON(): string {
    return JSON.stringify(this.lines, null, 2);
  }

  static fromJSON(data: any): Dictionary {
    const lines = Array.isArray(data) 
      ? data.map((f: any) => Field.fromJSON(f)) 
      : [];
    return new Dictionary(lines);
  }
}
