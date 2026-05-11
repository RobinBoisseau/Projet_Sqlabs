import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CoursService } from '../../../services/cours.service';
import { Cours } from '../../../models/cours';

@Component({
  selector: 'app-cours-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cours-edit.component.html',
})
export class CoursEditComponent implements OnInit {
  form!: FormGroup;
  cours!: Cours;
  loading = true;
  saving = false;
  error = '';
  success = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private coursService: CoursService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.coursService.getCour(id).subscribe({
      next: c => {
        this.cours = c;
        this.form = this.fb.group({
          nom:         [c.nom,         Validators.required],
          description: [c.description, Validators.required],
          image:       [c.image ?? ''],
          visibility:  [c.visibility],
        });
        this.loading = false;
      },
      error: () => { this.error = 'Cours introuvable.'; this.loading = false; }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.error = '';
    this.success = false;

    const payload = { ...this.form.value, image: this.form.value.image || null };

    this.coursService.updateCours(this.cours.id, payload).subscribe({
      next: () => {
        this.success = true;
        this.saving = false;
        setTimeout(() => this.router.navigate(['/admin/cours', this.cours.id]), 1200);
      },
      error: err => {
        this.error = err.error?.message ?? 'Une erreur est survenue.';
        this.saving = false;
      }
    });
  }
}
