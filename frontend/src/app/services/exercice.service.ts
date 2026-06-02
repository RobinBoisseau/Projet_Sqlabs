import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Exercice } from '../models/exercice';

@Injectable({ providedIn: 'root' })
export class ExerciceService {
  private apiUrl = 'http://localhost:8000/api/exercices';
  private tentativesUrl = 'http://localhost:8000/api/tentatives';

  constructor(private http: HttpClient) { }

  getExercices(): Observable<Exercice[]> {
    return this.http.get<any>(this.apiUrl).pipe(map(res => res.data || res));
  }

  getExerciceBySlug(slug: string): Observable<Exercice> {
    return this.http.get<any>(`${this.apiUrl}/${slug}`).pipe(map(res => res.data || res));
  }

  // Sauvegarde
  saveAttempt(exerciceId: number, data: any): Observable<any> {
    const payload = {
      exercice_id: exerciceId,
      dictionary: data.dictionary,
      dependencies: data.dependencies,
      model: data.model
    };
    return this.http.post(this.tentativesUrl, payload);
  }

  updateAttempt(id: number, data: any): Observable<any> {
    return this.http.put(`${this.tentativesUrl}/${id}`, {
      dictionary: data.dictionary,
      dependencies: data.dependencies,
      model: data.model,
    });
  }

  // Sauvegarde d'urgence (keepalive) — POST si pas d'ID, PUT sinon
  async emergencySave(exerciceId: number, data: any, tentativeId?: number | null) {
    const token = localStorage.getItem('auth_token');
    const body = JSON.stringify({
      ...(tentativeId ? {} : { exercice_id: exerciceId }),
      dictionary: data.dictionary,
      dependencies: data.dependencies,
      model: data.model,
    });
    const url = tentativeId ? `${this.tentativesUrl}/${tentativeId}` : this.tentativesUrl;
    return fetch(url, {
      method: tentativeId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body,
      keepalive: true
    });
  }

  getLastAttempt(exerciceId: number): Observable<any> {
    console.log('🔍 URL appelée :', `${this.tentativesUrl}/exercice/${exerciceId}`);
    return this.http.get(`${this.tentativesUrl}/exercice/${exerciceId}`);
  }

  analyzeMcd(mcd: any, tentativeId?: number): Observable<any> {
    return this.http.post('http://localhost:8000/api/ia/analyze-mcd', { mcd, tentative_id: tentativeId });
  }

  analyzeDictionary(dictionary: any[], tentativeId?: number): Observable<any> {
    return this.http.post('http://localhost:8000/api/ia/analyze-dictionary', { dictionary, tentative_id: tentativeId });
  }

  analyzeDependencies(dependencies: any[], tentativeId?: number): Observable<any> {
    return this.http.post('http://localhost:8000/api/ia/analyze-dependencies', { dependencies, tentative_id: tentativeId });
  }

  getCorrection(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${slug}/correction`);
  }

  updateExercice(slug: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${slug}/correction`, data);
  }

  createExercice(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  deleteExercice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getTestableTentatives(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${slug}/tentatives-testables`);
  }

  getAllTentatives(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${slug}/all-tentatives`);
  }

  getTentativeById(id: number): Observable<any> {
    return this.http.get(`${this.tentativesUrl}/${id}`);
  }

  toggleTestable(id: number): Observable<{ est_testable: boolean }> {
    return this.http.patch<{ est_testable: boolean }>(`${this.tentativesUrl}/${id}/testable`, {});
  }
}