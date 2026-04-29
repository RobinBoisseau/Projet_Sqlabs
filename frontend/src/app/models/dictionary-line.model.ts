export class DictionaryLine {
  id: string;
  NomMetier: string;
  NomTechnique: string;
  Type: string;

  constructor(id: string, NomMetier: string, NomTechnique: string, Type: string) {
    this.id = id;
    this.NomMetier = NomMetier;
    this.NomTechnique = NomTechnique;
    this.Type = Type;
  }
}