import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mcd } from '../../models/mcd';

export interface IaRemarqueMcd {
  id: string;
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

export interface IaItemCheckedEvent {
  section: 'mcd' | 'dictionary' | 'dependencies';
  id: string;
  message: string;
  action: 'add' | 'remove';
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
  @Input() mcd?: Mcd;
  @Output() closed = new EventEmitter<void>();
  @Output() itemChecked = new EventEmitter<IaItemCheckedEvent>();

  // État par item : 'showing' = ? affiché dans la table, 'resolved' = vert permanent
  itemStates = new Map<string, 'showing' | 'resolved'>();

  hasInvalidItems(section: 'mcd' | 'dictionary' | 'dependencies'): boolean {
    return this.results?.[section]?.remarques.some(r => r.statut === 'invalide') ?? false;
  }

  isAllValid(section: 'mcd' | 'dictionary' | 'dependencies'): boolean {
    const remarques = this.results?.[section]?.remarques;
    return !!remarques && remarques.length > 0 && !remarques.some(r => r.statut === 'invalide');
  }

  getInvalidRemarques(section: 'mcd' | 'dictionary' | 'dependencies'): any[] {
    return this.results?.[section]?.remarques.filter(r => r.statut === 'invalide') ?? [];
  }

  getMcdName(id: string): string {
    if (!this.mcd) return id;
    const entity = this.mcd.Entities.find(e => e.id === id);
    if (entity) return entity.name || id;
    const assoc = this.mcd.Associations.find(a => a.id === id);
    return assoc?.name || id;
  }

  getId(r: any, section: string): string {
    if (section === 'mcd') return r.id ?? r.entite ?? '';
    if (section === 'dictionary') return r.champ ?? '';
    return r.source ?? '';
  }

  getState(section: string, id: string): 'showing' | 'resolved' | undefined {
    return this.itemStates.get(`${section}:${id}`);
  }

  isShowing(section: string, id: string): boolean {
    return this.itemStates.get(`${section}:${id}`) === 'showing';
  }

  isResolved(section: string, id: string): boolean {
    return this.itemStates.get(`${section}:${id}`) === 'resolved';
  }

  // Cliquer sur la checkbox ou le texte : bascule entre orange ↔ showing
  onCheckboxChange(section: 'mcd' | 'dictionary' | 'dependencies', r: any): void {
    const id = this.getId(r, section);
    const key = `${section}:${id}`;
    const state = this.itemStates.get(key);

    if (state === 'resolved') return; // immuable

    if (!state) {
      // Orange → showing : affiche le ? dans la table
      this.itemStates = new Map(this.itemStates).set(key, 'showing');
      this.itemChecked.emit({ section, id, message: r.message, action: 'add' });
    } else {
      // Showing → orange : retire le ? de la table
      const next = new Map(this.itemStates);
      next.delete(key);
      this.itemStates = next;
      this.itemChecked.emit({ section, id, message: r.message, action: 'remove' });
    }
  }

  // Bouton "Traité" : passe en vert permanent et retire le ? du panel
  markResolved(section: 'mcd' | 'dictionary' | 'dependencies', r: any, event: MouseEvent): void {
    event.stopPropagation(); // empêche le click de remonter sur le div parent (onCheckboxChange)
    const id = this.getId(r, section);
    const key = `${section}:${id}`;
    if (this.itemStates.get(key) === 'showing') {
      this.itemChecked.emit({ section, id, message: r.message, action: 'remove' });
    }
    this.itemStates = new Map(this.itemStates).set(key, 'resolved');
  }
}
