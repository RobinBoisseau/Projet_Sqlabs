import { Champs } from './champs';
import { ParticipationEntite } from './participation-entite';

export class Association {
  constructor(
    public id: number = 1,
    public name: string = 'Construire',
    public participations: ParticipationEntite[] = [],
    public champs: Champs[] = []
  ) {}
}
