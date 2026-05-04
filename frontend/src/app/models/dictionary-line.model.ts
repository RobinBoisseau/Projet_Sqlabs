export class DictionaryLine {
  id: string;
  name: string;
  TechnicalName: string;
  Type: string;

  constructor(id: string, name: string, NomTechnique: string, Type: string) {
    this.id = id;
    this.name = name;
    this.TechnicalName = NomTechnique;
    this.Type = Type;
  }
}