import { Champs } from './champs';
import { ParticipationEntite } from './participation-entite';

export class Association {
  constructor(
    public id: number = 1,
    public name: string = '',
    public source: string[] = [], // Ajouté pour le HTML
    public cible: string[] = [],  // Ajouté pour le HTML
    public participations: ParticipationEntite[] = [],
    public fields: Champs[] = []
  ) {}

  static fromJSON(data: any): Association {
    return new Association(
      data.id,
      data.name,
      data.source || [],
      data.cible || [],
      data.participations ? data.participations.map((p: any) => ParticipationEntite.fromJSON(p)) : [],
      data.fields ? data.fields.map((f: any) => Champs.fromJSON(f)) : []
    );
  }
}