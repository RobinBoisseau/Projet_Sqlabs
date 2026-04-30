import { Champs } from './champs';
import { ParticipationEntite } from './participation-entite';

export class Association {
  constructor(
    public id: number = 1,
    public name: string = 'Construire',
    public participations: ParticipationEntite[] = [],
    public fields: Champs[] = []
    // Note : Si tu veux l'afficher sur le graphe, n'oublie pas d'ajouter 
    // x, y, largeur, hauteur ici plus tard comme pour Entities
  ) {}

  static fromJSON(data: any): Association {
    // 1. Reconstruction de la liste des participations
    const participationsList = data.participations
      ? data.participations.map((p: any) => ParticipationEntite.fromJSON(p))
      : [];

    // 2. Reconstruction de la liste des champs (attributs de l'asso)
    const fieldsList = data.fields
      ? data.fields.map((f: any) => new Champs(f.id, f.nom, f.type, f.isPK))
      : [];

    // 3. Retourne la nouvelle instance d'Association
    return new Association(
      data.id,
      data.name,
      participationsList,
      fieldsList
    );
  }
}