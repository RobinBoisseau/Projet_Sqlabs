import { DictionaryLine } from './dictionary-line.model';

export class Dictionary {
  public lines: DictionaryLine[] = [];

  constructor() {}

  // --- FONCTION : OBJET -> JSON (String) ---
  // C'est ici qu'on crée le format "ligne1", "ligne2"
  genererJSON(): string {
    const exportData: any = {};
    
    this.lines.forEach((lines, index) => {
      const key = `lignes${index + 1}`; // Crée "ligne1", "ligne2"...
      exportData[key] = {
        id: lines.id,
        name: lines.name,
        TechnicalName: lines.TechnicalName,
        Type: lines.Type
      };
    });

    // On emballe tout dans la clé "dictionnary" comme demandé
    return JSON.stringify({ "dictionnary": exportData }, null, 4);
  }
}