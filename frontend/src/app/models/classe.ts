export interface Classe {
  id: number;
  nom: string;
  description: string | null;
  image: string | null;
  visibility: 'public' | 'private';
  member_count: number;
  join_code: string | null;
  can_edit: boolean;
  can_delete: boolean;
  is_member: boolean;
  created_at: string;
}
