import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ClasseService } from '../../../services/classe.service';
import { Classe } from '../../../models/classe';

@Component({
  selector: 'app-class-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './class-layout.component.html',
})
export class ClassLayoutComponent implements OnInit {
  classe: Classe | null = null;
  manageOpen = false;
  progressOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classeService: ClasseService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.classeService.getClasse(id).subscribe({
      next: c => this.classe = c,
      error: () => this.router.navigate(['/']),
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as Element).closest('.manage-dropdown')) this.manageOpen = false;
    if (!(e.target as Element).closest('.progress-dropdown')) this.progressOpen = false;
  }
}
