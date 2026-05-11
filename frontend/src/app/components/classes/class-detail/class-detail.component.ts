import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ClasseService } from '../../../services/classe.service';
import { Classe } from '../../../models/classe';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './class-detail.component.html',
})
export class ClassDetailComponent implements OnInit {
  classe: Classe | null = null;

  constructor(private route: ActivatedRoute, private classeService: ClasseService) {}

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.classeService.getClasse(id).subscribe(c => this.classe = c);
  }
}
