import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Exercice } from '../models/exercice';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExerciceService {

  private apiUrl = `${environment.apiUrl}/exercices`;

  constructor(private http: HttpClient) {}

  getExercices(): Observable<Exercice[]> {
    return this.http.get<{data: Exercice[]}>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getExerciceBySlug(slug: string): Observable<Exercice> {
    return this.http.get<{data: Exercice}>(`${this.apiUrl}/s/${slug}`).pipe(
      map(response => response.data));
  }
}
