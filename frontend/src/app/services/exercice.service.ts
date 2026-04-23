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

  private apiUrl = `http://localhost:8000/api/exercices`;

  constructor(private http: HttpClient) {}

  getExercices(): Observable<Exercice[]> {
    return this.http.get<{data: Exercice[]}>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getExercice(id: number): Observable<Exercice> {
    return this.http.get<{data: Exercice}>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }
}
