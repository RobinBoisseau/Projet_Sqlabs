import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClasseService } from '../../../services/classe.service';
import { Classe } from '../../../models/classe';

@Component({
  selector: 'app-class-delete',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './class-delete.component.html',
})
export class ClassDeleteComponent implements OnInit {
  classe: Classe | null = null;
  loading = true;
  deleting = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classeService: ClasseService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.classeService.getClasse(id).subscribe({
      next: c => {
        if (!c.can_delete) {
          this.router.navigate(['/classes', id]);
          return;
        }
        this.classe = c;
        this.loading = false;
      },
      error: () => this.router.navigate(['/classes']),
    });
  }

  confirm(): void {
    if (!this.classe || this.deleting) return;
    this.deleting = true;
    this.classeService.deleteClasse(this.classe.id).subscribe({
      next: () => this.router.navigate(['/classes']),
      error: () => { this.error = 'Une erreur est survenue.'; this.deleting = false; }
    });
  }
}
