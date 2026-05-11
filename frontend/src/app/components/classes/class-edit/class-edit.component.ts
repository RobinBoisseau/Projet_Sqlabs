import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClasseService } from '../../../services/classe.service';
import { Classe } from '../../../models/classe';

@Component({
  selector: 'app-class-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './class-edit.component.html',
})
export class ClassEditComponent implements OnInit {
  form: FormGroup;
  classe: Classe | null = null;
  loading = true;
  saving = false;
  error = '';
  imagePreview: string | null = null;
  private imageFile: File | null = null;
  classeId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private classeService: ClasseService,
  ) {
    this.form = this.fb.group({
      nom:         ['', Validators.required],
      description: [''],
      visibility:  ['public'],
      join_code:   ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
    });
  }

  ngOnInit(): void {
    this.classeId = Number(this.route.parent!.snapshot.paramMap.get('id'));
    this.classeService.getClasse(this.classeId).subscribe({
      next: (classe) => {
        if (!classe.can_edit) {
          this.router.navigate(['/classes', this.classeId]);
          return;
        }
        this.classe = classe;
        this.form.patchValue({
          nom:         classe.nom,
          description: classe.description ?? '',
          visibility:  classe.visibility,
          join_code:   classe.join_code ?? '',
        });
        if (classe.image) this.imagePreview = classe.image;
        this.loading = false;
      },
      error: () => this.router.navigate(['/classes']),
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

    this.classeService.updateClasse(this.classeId, fd).subscribe({
      next: () => this.router.navigate(['/classes', this.classeId]),
      error: err => {
        this.error = err.error?.message ?? 'Une erreur est survenue.';
        this.saving = false;
      },
    });
  }
}
