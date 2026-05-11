import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form: FormGroup;
  errorMessage = '';
  fieldErrors: Record<string, string[]> = {};
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      name:                  ['', Validators.required],
      email:                 ['', [Validators.required, Validators.email]],
      password:              ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
      role:                  ['etudiant', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.fieldErrors = {};

    const { name, email, password, password_confirmation, role } = this.form.value;
    this.auth.register(name, email, password, password_confirmation, role).subscribe({
      next: () => this.router.navigate(['/exercices']),
      error: err => {
        this.fieldErrors = err.error?.errors ?? {};
        this.errorMessage = err.error?.message ?? 'Une erreur est survenue.';
        this.loading = false;
      }
    });
  }

  getFieldError(field: string): string | null {
    return this.fieldErrors[field]?.[0] ?? null;
  }
}
