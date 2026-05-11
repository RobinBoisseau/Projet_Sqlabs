import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CoursService } from '../../../services/cours.service';
import { Cours } from '../../../models/cours';

@Component({
  selector: 'app-cours-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './cours-layout.component.html',
})
export class CoursLayoutComponent implements OnInit {
  cours: Cours | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursService: CoursService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.coursService.getCour(id).subscribe({
      next: c => this.cours = c,
      error: () => this.router.navigate(['/admin/cours']),
    });
  }
}
