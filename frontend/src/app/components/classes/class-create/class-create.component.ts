import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClasseService } from '../../../services/classe.service';

@Component({
  selector: 'app-class-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './class-create.component.html',
})
export class ClassCreateComponent {
  form: FormGroup;
  saving = false;
  error = '';
  imagePreview: string | null = null;
  private imageFile: File | null = null;

  constructor(private fb: FormBuilder, private classeService: ClasseService, private router: Router) {
    this.form = this.fb.group({
      nom:         ['', Validators.required],
      description: [''],
      visibility:  ['public'],
      join_code:   ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
    });
  }

  generateCode(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.form.patchValue({ join_code: code });
  }

  onImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.imagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.error = '';

    const fd = new FormData();
    const v = this.form.value;
    fd.append('nom', v.nom);
    fd.append('description', v.description ?? '');
    fd.append('visibility', v.visibility);
    fd.append('join_code', v.join_code);
    if (this.imageFile) fd.append('image', this.imageFile);

    this.classeService.createClasse(fd).subscribe({
      next: classe => this.router.navigate(['/classes', classe.id]),
      error: err => { this.error = err.error?.message ?? 'Une erreur est survenue.'; this.saving = false; }
    });
  }
}
