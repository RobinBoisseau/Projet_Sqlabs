import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PromptService } from '../../../services/prompt.service';
import { Prompt } from '../../../models/prompt';

declare const Quill: any;

@Component({
  selector: 'app-prompt-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './prompt-create.component.html',
  styleUrl: './prompt-create.component.css',
})
export class PromptCreateComponent implements OnInit, AfterViewInit {
  isEdit = false;
  promptId: number | null = null;
  isSaving = false;
  error = '';
  warningMessage = '';

  form: Partial<Prompt> = {
    nom: '',
    categorie: 'mcd',
    prompt: '',
    actif: false,
  };

  @ViewChild('quillEditor') quillEditorRef!: ElementRef;
  private quillInstance: any;

  constructor(
    private promptService: PromptService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.promptId = +id;
      this.promptService.getById(this.promptId).subscribe({
        next: (p: Prompt) => {
          this.form = { ...p };
          if (this.quillInstance && p.prompt) {
            this.quillInstance.root.innerHTML = p.prompt;
          }
        },
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.quillEditorRef?.nativeElement) {
        this.quillInstance = new Quill(this.quillEditorRef.nativeElement, {
          theme: 'snow',
          placeholder: 'Rédigez votre prompt ici… Utilisez {{contexte}}, {{student_json}}, {{correction_json}} comme variables.',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              ['code-block'],
              ['clean'],
            ],
          },
        });

        if (this.form.prompt) {
          this.quillInstance.root.innerHTML = this.form.prompt;
        }

        this.quillInstance.on('text-change', () => {
          this.form.prompt = this.quillInstance.root.innerHTML;
        });
      }
    }, 0);
  }

  confirmWarning(): void {
    this.warningMessage = '';
    this.router.navigate(['/admin/prompts']);
  }

  save(): void {
    const plainText = this.quillInstance?.getText().trim() ?? this.form.prompt?.trim();
    if (!this.form.nom?.trim() || !plainText) {
      this.error = 'Le nom et le contenu du prompt sont obligatoires.';
      return;
    }
    this.isSaving = true;
    this.error = '';

    const request = this.isEdit
      ? this.promptService.update(this.promptId!, this.form)
      : this.promptService.create(this.form);

    request.subscribe({
      next: (res: any) => {
        if (res?.forced_actif) {
          this.warningMessage = 'Aucun prompt de cette catégorie n\'était actif. Le prompt a été automatiquement mis en actif.';
          this.isSaving = false;
        } else {
          this.router.navigate(['/admin/prompts']);
        }
      },
      error: () => {
        this.error = 'Une erreur est survenue.';
        this.isSaving = false;
      },
    });
  }
}
