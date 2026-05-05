import { Injectable } from '@angular/core';
import { Field } from '../models/field';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {
  private readonly STORAGE_KEY = 'mon_historique_travail';

  // Sauvegarde brute en JSON
  save(lines: Field[]): void {
    try {
      const data = JSON.stringify(lines);
      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (e) {
      console.error("Erreur localStorage", e);
    }
  }

  // Chargement
  load(): Field[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}