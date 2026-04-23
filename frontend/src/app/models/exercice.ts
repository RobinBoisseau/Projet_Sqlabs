export interface Exercice {
  id: number;
  titre: string;
  slug:string;
  enonce: string;
  type: 'SQL' | 'BPMN';
  etat: 'Fait' | 'Non Fait';
  slug: string;
}