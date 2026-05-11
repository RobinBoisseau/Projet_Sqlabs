import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Cours, CoursExercice } from '../models/cours';

@Injectable({ providedIn: 'root' })
export class CoursService {
  private readonly API = 'http://localhost:8000/api/cours';

  constructor(private http: HttpClient) {}

  getCours(): Observable<Cours[]> {
    return this.http.get<{ data: Cours[] }>(this.API).pipe(map(res => res.data));
  }

  getCour(id: number): Observable<Cours> {
    return this.http.get<{ data: Cours }>(`${this.API}/${id}`).pipe(map(res => res.data));
  }

  createCours(data: Partial<Cours>): Observable<Cours> {
    return this.http.post<{ data: Cours }>(this.API, data).pipe(map(res => res.data));
  }

  updateCours(id: number, data: Partial<Cours>): Observable<Cours> {
    return this.http.put<{ data: Cours }>(`${this.API}/${id}`, data).pipe(map(res => res.data));
  }

  getStats(id: number): Observable<{ visibility: boolean; exercices_count: number; started: number; completed: number }> {
    return this.http.get<{ data: any }>(`${this.API}/${id}/stats`).pipe(map(res => res.data));
  }

  updateExercices(id: number, exercices: { id: number; order: number }[]): Observable<Cours> {
    return this.http.put<{ data: Cours }>(`${this.API}/${id}/exercices`, { exercices }).pipe(map(res => res.data));
  }

  deleteCours(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
