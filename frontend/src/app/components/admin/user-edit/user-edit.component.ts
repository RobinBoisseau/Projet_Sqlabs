import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit {
  form!: FormGroup;
  user!: User;
  loading = true;
  saving = false;
  error = '';
  success = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUser(id).subscribe({
      next: user => {
        this.user = user;
        this.form = this.fb.group({
          name:  [user.name,  Validators.required],
          email: [user.email, [Validators.required, Validators.email]],
          role:  [user.role,  Validators.required]
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Utilisateur introuvable.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.error = '';
    this.success = false;

    this.userService.updateUser(this.user.id, this.form.value).subscribe({
      next: () => {
        this.success = true;
        this.saving = false;
        setTimeout(() => this.router.navigate(['/admin/users']), 1000);
      },
      error: err => {
        this.error = err.error?.message ?? 'Une erreur est survenue.';
        this.saving = false;
      }
    });
  }
}
