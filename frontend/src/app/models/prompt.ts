export interface Prompt {
  id: number;
  nom: string;
  prompt: string;
  categorie: 'mcd' | 'dd' | 'df';
  actif: boolean;
  poid: number;
}
