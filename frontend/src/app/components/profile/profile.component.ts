import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('password_confirmation')?.value;
  if (password && confirmation && password !== confirmation) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  error = '';
  success = false;

  constructor(private fb: FormBuilder, public auth: AuthService) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    this.form = this.fb.group({
      name:                  [user?.name  ?? '', Validators.required],
      email:                 [user?.email ?? '', [Validators.required, Validators.email]],
      password:              ['', [Validators.minLength(8)]],
      password_confirmation: ['']
    }, { validators: passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.error = '';
    this.success = false;

    const { name, email, password, password_confirmation } = this.form.value;
    const payload: Record<string, string> = { name, email };
    if (password) {
      payload['password'] = password;
      payload['password_confirmation'] = password_confirmation;
    }

    this.auth.updateProfile(payload).subscribe({
      next: () => {
        this.success = true;
        this.saving = false;
        this.form.patchValue({ password: '', password_confirmation: '' });
      },
      error: err => {
        this.error = err.error?.message ?? 'Une erreur est survenue.';
        this.saving = false;
      }
    });
  }
}
