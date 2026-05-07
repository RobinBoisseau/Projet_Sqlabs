export interface Exercice {
  id: number;
  title: string;
  slug: string;
  statement: string;
  type: 'SQL' | 'BPMN';
  status: 'Completed' | 'In Progress' | 'To Do'; // <--- CES 3 MOTS EXACTS
}