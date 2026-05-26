import { Injectable } from '@angular/core';
import { Field } from '../models/field';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DictionaryService {
  
  // Canal de notification
  private updated$ = new Subject<{ slug: string, fields: Field[] }>();
  onUpdated$ = this.updated$.asObservable();

  private getStorageKey(slug: string): string {
    return `dict_data_${slug}`;
  }

  save(slug: string, lines: Field[]): void {
    localStorage.setItem(this.getStorageKey(slug), JSON.stringify(lines));
    this.updated$.next({ slug, fields: lines });
  }

  load(slug: string): Field[] {
    const data = localStorage.getItem(this.getStorageKey(slug));
    return data ? JSON.parse(data) : [];
  }
}