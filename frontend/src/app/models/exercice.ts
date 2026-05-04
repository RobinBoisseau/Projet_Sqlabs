export interface Exercice {
  id: number;
  title: string;
  slug:string;
  statement: string;
  type: 'SQL' | 'BPMN';
  status: 'Terminé' | 'En cours' | 'A faire';
}