import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prompt } from '../models/prompt';

@Injectable({ providedIn: 'root' })
export class PromptService {
  private apiUrl = 'http://localhost:8000/api/prompts';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Prompt[]> {
    return this.http.get<Prompt[]>(this.apiUrl);
  }

  getById(id: number): Observable<Prompt> {
    return this.http.get<Prompt>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Prompt>): Observable<{ prompt: Prompt; forced_actif: boolean }> {
    return this.http.post<{ prompt: Prompt; forced_actif: boolean }>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Prompt>): Observable<{ prompt: Prompt; forced_actif: boolean }> {
    return this.http.put<{ prompt: Prompt; forced_actif: boolean }>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
