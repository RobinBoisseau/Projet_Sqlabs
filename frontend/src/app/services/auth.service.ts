import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:8000/api';
  private readonly TOKEN_KEY = 'auth_token';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string): Observable<{ user: User; token: string }> {
    return this.http.post<{ user: User; token: string }>(`${this.API}/login`, { email, password }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(name: string, email: string, password: string, passwordConfirmation: string, role: string): Observable<{ user: User; token: string }> {
    return this.http.post<{ user: User; token: string }>(`${this.API}/register`, {
      name, email, password, password_confirmation: passwordConfirmation, role
    }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    this.http.post(`${this.API}/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  updateProfile(data: Record<string, string>): Observable<User> {
    return this.http.put<{ data: User }>(`${this.API}/profile`, data).pipe(
      tap(res => this.currentUserSubject.next(res.data)),
      map(res => res.data)
    );
  }

  loadCurrentUser(): void {
    if (!this.getToken()) return;
    this.http.get<{ data: User }>(`${this.API}/me`).subscribe({
      next: res => this.currentUserSubject.next(res.data),
      error: () => this.clearSession()
    });
  }

  private storeSession(res: { user: User; token: string }): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    this.currentUserSubject.next(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}
