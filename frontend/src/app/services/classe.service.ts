import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Classe } from '../models/classe';

export interface Member {
  id: number;
  name: string;
  email: string;
  pivot_role: 'responsable' | 'student';
}

@Injectable({ providedIn: 'root' })
export class ClasseService {
  private api = 'http://localhost:8000/api/classe';

  constructor(private http: HttpClient) {}

  getClasses(): Observable<Classe[]> {
    return this.http.get<{ data: Classe[] }>(this.api).pipe(map(r => r.data));
  }

  getClasse(id: number): Observable<Classe> {
    return this.http.get<{ data: Classe }>(`${this.api}/${id}`).pipe(map(r => r.data));
  }

  createClasse(formData: FormData): Observable<Classe> {
    return this.http.post<{ data: Classe }>(this.api, formData).pipe(map(r => r.data));
  }

  updateClasse(id: number, formData: FormData): Observable<Classe> {
    formData.append('_method', 'PUT');
    return this.http.post<{ data: Classe }>(`${this.api}/${id}`, formData).pipe(map(r => r.data));
  }

  deleteClasse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  join(join_code: string): Observable<Classe> {
    return this.http.post<{ data: Classe }>(`${this.api}/join`, { join_code }).pipe(map(r => r.data));
  }

  getMembers(classeId: number): Observable<Member[]> {
    return this.http.get<{ data: Member[] }>(`${this.api}/${classeId}/members`).pipe(map(r => r.data));
  }

  removeMembers(classeId: number, userIds: number[]): Observable<void> {
    return this.http.delete<void>(`${this.api}/${classeId}/members`, { body: { user_ids: userIds } });
  }

  promoteMembers(classeId: number, userIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.api}/${classeId}/members/promote`, { user_ids: userIds });
  }

  demoteMembers(classeId: number, userIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.api}/${classeId}/members/demote`, { user_ids: userIds });
  }

  getClasseCours(classeId: number): Observable<any[]> {
    return this.http.get<{ data: any[] }>(`${this.api}/${classeId}/cours`)
      .pipe(map(r => r.data));
  }

  updateClasseCours(classeId: number, cours: { id: number; order: number }[]): Observable<void> {
    return this.http.put<void>(`${this.api}/${classeId}/cours`, { cours });
  }

  getExerciceDetail(classeId: number, slug: string): Observable<{ exercice: any; students: any[] }> {
    return this.http.get<{ data: { exercice: any; students: any[] } }>(`${this.api}/${classeId}/exercice/${slug}`)
      .pipe(map(r => r.data));
  }

  getStudentTentatives(classeId: number, slug: string, userId: number): Observable<any[]> {
    return this.http.get<{ data: any[] }>(
      `${this.api}/${classeId}/exercice/${slug}/student/${userId}/tentatives`
    ).pipe(map(r => r.data));
  }

  getStudentProgress(classeId: number, userId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${classeId}/student/${userId}/progress`);
  }
}
