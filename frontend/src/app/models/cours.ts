export interface CoursExercice {
  id: number;
  title: string;
  slug: string;
  type: string;
  order: number;
}

export interface Cours {
  id: number;
  nom: string;
  description: string;
  image: string | null;
  visibility: boolean;
  exercices_count?: number;
  exercices?: CoursExercice[];
}
