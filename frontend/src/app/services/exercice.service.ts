import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exercice } from '../models/exercice';

@Injectable({
  providedIn: 'root'
})
export class ExerciceService {
  // Remplace par l'URL réelle de ton API Laravel
  private apiUrl = 'http://localhost:8000/api/exercices';

  constructor(private http: HttpClient) { }

  // Récupère tous les exercices pour la liste
  getExercices(): Observable<Exercice[]> {
    return this.http.get<Exercice[]>(this.apiUrl);
  }

  // Récupère un exercice précis via son slug (pour la page de détail)
  getExerciceBySlug(slug: string): Observable<Exercice> {
    return this.http.get<Exercice>(`${this.apiUrl}/${slug}`);
  }

  // Optionnel : Sauvegarder le travail de l'étudiant
  saveExerciceProgress(slug: string, mcdData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${slug}/save`, { mcd_json: mcdData });
  }
  // Dans ton exercice.service.ts
saveMcd(slug: string, mcdData: any): Observable<any> {
  // On envoie l'objet à une route Laravel (ex: /api/exercices/{slug}/save)
  return this.http.post(`${this.apiUrl}/${slug}/save`, { 
    mcd_json: JSON.stringify(mcdData) 
  });
}
}