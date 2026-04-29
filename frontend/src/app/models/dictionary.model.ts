import { DictionaryLine } from './dictionary-line.model';

export class Dictionary {
  // On stocke les lignes dans une liste classique pour Angular (plus facile pour les boucles)
  public lignes: DictionaryLine[] = [];

  constructor() {}

  // --- FONCTION : OBJET -> JSON (String) ---
  // C'est ici qu'on crée le format "ligne1", "ligne2"
  genererJSON(): string {
    const exportData: any = {};
    
    this.lignes.forEach((ligne, index) => {
      const key = `ligne${index + 1}`; // Crée "ligne1", "ligne2"...
      exportData[key] = {
        id: ligne.id,
        NomMetier: ligne.NomMetier,
        NomTechnique: ligne.NomTechnique,
        Type: ligne.Type
      };
    });

    // On emballe tout dans la clé "dictionnary" comme demandé
    return JSON.stringify({ "dictionnary": exportData }, null, 4);
  }
}