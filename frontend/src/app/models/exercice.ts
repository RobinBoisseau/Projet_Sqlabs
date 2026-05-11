export interface Exercice {
  id: number;
  title: string;
  slug: string;
  statement: string;
  type: 'SQL' | 'BPMN';
  status: 'completed' | 'in_progress' | 'to_do';
}
