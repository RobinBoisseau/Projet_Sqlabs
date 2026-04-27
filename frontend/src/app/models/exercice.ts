export interface Exercice {
  id: number;
  titre: string;
  slug:string;
  enonce: string;
  type: 'SQL' | 'BPMN';
  etat: 'fini' | 'en cours' | 'non fini';
}