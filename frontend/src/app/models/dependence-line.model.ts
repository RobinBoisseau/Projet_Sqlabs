export class DependenceLine {
  id: string;
  source: string[]; 
  cible: string[]; // <--- Change 'string' en 'string[]' ici !

  constructor(id: string, source: string[] = [], cible: string[] = []) { // <--- [] ici aussi
    this.id = id;
    this.source = source;
    this.cible = cible;
  }
}