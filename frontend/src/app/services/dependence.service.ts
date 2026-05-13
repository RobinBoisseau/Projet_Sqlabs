import { Injectable } from '@angular/core';
import { DependenceLine } from '../models/dependence-line.model';

@Injectable({ providedIn: 'root' })
export class DependenceService {
  private getStorageKey(slug: string): string {
    return `dependences_${slug}`; // ✅ clé unique par exercice
  }

  saveDependences(slug: string, lines: DependenceLine[]): void {
    localStorage.setItem(this.getStorageKey(slug), JSON.stringify(lines));
  }

  loadDependences(slug: string): DependenceLine[] {
    const data = localStorage.getItem(this.getStorageKey(slug));
    return data ? JSON.parse(data).map((d: any) => DependenceLine.fromJSON(d)) : [];
  }
}