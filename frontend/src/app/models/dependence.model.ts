import { DependenceLine } from './dependence-line.model';

export class Dependence { // <--- Renomme bien en 'Dependence'
  public lignes: DependenceLine[] = [];

  constructor() {}

  genererJSON(): string {
    const exportData: any = {};
    
    this.lignes.forEach((ligne, index) => {
      const key = `ligne${index + 1}`;
      exportData[key] = {
        id: ligne.id,
        source: ligne.source,
        cible: ligne.cible, // Ce sera un tableau de strings
      };
    });

    return JSON.stringify({ "dependence": exportData }, null, 4);
  }
}