import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = 'http://localhost:8000/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<{ data: User[] }>(this.API).pipe(map(res => res.data));
  }

  getUser(id: number): Observable<User> {
    return this.http.get<{ data: User }>(`${this.API}/${id}`).pipe(map(res => res.data));
  }

  updateUser(id: number, data: Partial<Pick<User, 'name' | 'email' | 'role'>>): Observable<User> {
    return this.http.put<{ data: User }>(`${this.API}/${id}`, data).pipe(map(res => res.data));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
