import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface IaRemarqueMcd {
  entite: string;
  statut: 'valide' | 'invalide';
  message: string;
}

export interface IaRemarqueDictionary {
  champ: string;
  statut: 'valide' | 'invalide';
  message: string;
}

export interface IaRemarqueDependency {
  source: string;
  statut: 'valide' | 'invalide';
  message: string;
}

export interface IaResults {
  mcd:          { remarques: IaRemarqueMcd[] }          | null;
  dictionary:   { remarques: IaRemarqueDictionary[] }   | null;
  dependencies: { remarques: IaRemarqueDependency[] }   | null;
}

@Component({
  selector: 'app-return-ia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './return-ia.component.html',
  styleUrls: ['./return-ia.component.css']
})
export class ReturnIaComponent {
  @Input() results!: IaResults;
  @Output() closed = new EventEmitter<void>();
}