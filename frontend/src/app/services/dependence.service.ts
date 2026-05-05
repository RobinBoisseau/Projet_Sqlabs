import { Injectable } from '@angular/core';
import { DependenceLine } from '../models/dependence-line.model';

@Injectable({
  providedIn: 'root'
})
export class DependenceService {
  private readonly STORAGE_KEY = 'mcd_dependences_progress';

  saveDependences(lines: DependenceLine[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lines));
  }

  loadDependences(): DependenceLine[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data).map((d: any) => DependenceLine.fromJSON(d)) : [];
  }
}