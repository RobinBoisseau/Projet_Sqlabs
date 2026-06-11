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
  mcd: { remarques: IaRemarqueMcd[] } | null;
  dictionary: { remarques: IaRemarqueDictionary[] } | null;
  dependencies: { remarques: IaRemarqueDependency[] } | null;
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

  itemStates = new Map<string, 'showing' | 'resolved'>();

  // --- LOGIQUE EXISTANTE ---
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

  onCheckboxChange(section: 'mcd' | 'dictionary' | 'dependencies', r: any): void {
    const id = this.getId(r, section);
    const key = `${section}:${id}`;
    const state = this.itemStates.get(key);
    if (state === 'resolved') return;

    if (!state) {
      this.itemStates = new Map(this.itemStates).set(key, 'showing');
      this.itemChecked.emit({ section, id, message: r.message, action: 'add' });
    } else {
      const next = new Map(this.itemStates);
      next.delete(key);
      this.itemStates = next;
      this.itemChecked.emit({ section, id, message: r.message, action: 'remove' });
    }
  }

  // --- NOUVELLES FONCTIONNALITÉS ---

  // Bouton "Tout traiter" pour une section
  markAllResolved(section: 'mcd' | 'dictionary' | 'dependencies'): void {
    const remarques = this.getInvalidRemarques(section);
    const nextStates = new Map(this.itemStates);

    remarques.forEach(r => {
      const id = this.getId(r, section);
      const key = `${section}:${id}`;

      // Si on était en train d'afficher l'aide, on demande au parent de la retirer
      if (this.itemStates.get(key) === 'showing') {
        this.itemChecked.emit({ section, id, message: r.message, action: 'remove' });
      }

      nextStates.set(key, 'resolved');
    });

    this.itemStates = nextStates;
  }

  // Modifié pour être appelable n'importe quand (plus besoin du isShowing)
  markResolved(section: 'mcd' | 'dictionary' | 'dependencies', r: any, event: MouseEvent): void {
    event.stopPropagation();
    const id = this.getId(r, section);
    const key = `${section}:${id}`;

    // Si l'aide était affichée, on la retire
    if (this.itemStates.get(key) === 'showing') {
      this.itemChecked.emit({ section, id, message: r.message, action: 'remove' });
    }

    this.itemStates = new Map(this.itemStates).set(key, 'resolved');
  }
}