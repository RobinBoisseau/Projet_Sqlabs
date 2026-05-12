import { Injectable } from '@angular/core';
import { Field } from '../models/field';

@Injectable({ providedIn: 'root' })
export class DictionaryService {
  // On enlève la constante fixe
  private getStorageKey(slug: string): string {
    return `dict_data_${slug}`; // Clé unique par exercice
  }

  save(slug: string, lines: Field[]): void {
    localStorage.setItem(this.getStorageKey(slug), JSON.stringify(lines));
  }

  load(slug: string): Field[] {
    const data = localStorage.getItem(this.getStorageKey(slug));
    return data ? JSON.parse(data) : [];
  }
}