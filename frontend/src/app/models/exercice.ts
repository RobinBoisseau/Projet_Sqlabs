export interface Exercice {
  id: number;
  titre: string;
  slug:string;
  enonce: string;
  type: 'SQL' | 'BPMN';
  statut: 'Terminé' | 'En cours' | 'A faire';
}