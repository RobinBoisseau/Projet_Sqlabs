import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Classe } from '../models/classe';

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
}
