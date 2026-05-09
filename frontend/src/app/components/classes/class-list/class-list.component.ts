import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClasseService } from '../../../services/classe.service';
import { Classe } from '../../../models/classe';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './class-list.component.html',
})
export class ClassListComponent implements OnInit {
  classes: Classe[] = [];
  loading = true;
  error = '';

  constructor(private classeService: ClasseService) {}

  ngOnInit(): void {
    this.classeService.getClasses().subscribe({
      next: classes => { this.classes = classes; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les classes.'; this.loading = false; }
    });
  }
}
