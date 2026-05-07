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

  // Sauvegarde — on envoie les noms anglais, le controller fait le mapping vers FR
  saveAttempt(exerciceId: number, data: any): Observable<any> {
    const payload = {
      exercice_id: exerciceId,
      dictionary: data.dictionary,
      dependencies: data.dependencies,
      model: data.model
    };
    return this.http.post(this.tentativesUrl, payload);
  }

  // Sauvegarde d'urgence (keepalive) pour la fermeture du navigateur
  async emergencySave(exerciceId: number, data: any) {
    const payload = JSON.stringify({
      exercice_id: exerciceId,
      dictionary: data.dictionary,
      dependencies: data.dependencies,
      model: data.model
    });
    return fetch(this.tentativesUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    });
  }

  getLastAttempt(exerciceId: number): Observable<any> {
    console.log('🔍 URL appelée :', `${this.tentativesUrl}/exercice/${exerciceId}`);
    return this.http.get(`${this.tentativesUrl}/exercice/${exerciceId}`);
  }
}