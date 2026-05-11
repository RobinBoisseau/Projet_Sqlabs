import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CoursService } from '../../services/cours.service';
import { Cours } from '../../models/cours';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomeComponent implements OnInit {
  cours: Cours[] = [];
  loading = true;
  error = '';

  constructor(private coursService: CoursService) {}

  ngOnInit(): void {
    this.coursService.getCours().subscribe({
      next: data => {
        this.cours = data.filter(c => c.visibility);
        this.loading = false;
      },
      error: () => { this.error = 'Impossible de charger les cours.'; this.loading = false; },
    });
  }

  truncate(text: string, max = 100): string {
    return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
  }
}
