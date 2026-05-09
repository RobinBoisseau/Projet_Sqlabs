import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ClasseService, Member } from '../../../services/classe.service';

interface SelectableMember extends Member {
  selected: boolean;
}

@Component({
  selector: 'app-class-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-members.component.html',
})
export class ClassMembersComponent implements OnInit {
  classeId!: number;
  members: SelectableMember[] = [];
  loading = true;
  error = '';
  searchQuery = '';
  actionMessage = '';
  private lastCheckedIndex: number | null = null;

  constructor(private route: ActivatedRoute, private classeService: ClasseService) {}

  ngOnInit(): void {
    this.classeId = Number(this.route.parent!.snapshot.paramMap.get('id'));
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.classeService.getMembers(this.classeId).subscribe({
      next: (data) => {
        this.members = data.map(m => ({ ...m, selected: false }));
        this.loading = false;
        this.lastCheckedIndex = null;
      },
      error: () => {
        this.error = 'Impossible de charger les membres.';
        this.loading = false;
      },
    });
  }

  get filtered(): SelectableMember[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.members;
    return this.members.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }

  get selectedIds(): number[] {
    return this.members.filter(m => m.selected).map(m => m.id);
  }

  get allSelected(): boolean {
    return this.filtered.length > 0 && this.filtered.every(m => m.selected);
  }

  get someSelected(): boolean {
    return this.filtered.some(m => m.selected);
  }

  toggleAll(checked: boolean): void {
    this.filtered.forEach(m => (m.selected = checked));
  }

  onCheckbox(event: MouseEvent, index: number): void {
    const filtered = this.filtered;
    const currentValue = filtered[index].selected;

    if (event.shiftKey && this.lastCheckedIndex !== null) {
      const start = Math.min(this.lastCheckedIndex, index);
      const end = Math.max(this.lastCheckedIndex, index);
      for (let i = start; i <= end; i++) {
        filtered[i].selected = currentValue;
      }
    }

    this.lastCheckedIndex = index;
  }

  removeMembers(ids: number[]): void {
    if (!ids.length) return;
    this.classeService.removeMembers(this.classeId, ids).subscribe({
      next: () => {
        this.actionMessage = 'Membres retirés de la classe.';
        this.loadMembers();
      },
      error: () => (this.error = 'Erreur lors du retrait des membres.'),
    });
  }

  promote(ids: number[]): void {
    if (!ids.length) return;
    this.classeService.promoteMembers(this.classeId, ids).subscribe({
      next: () => {
        this.actionMessage = 'Membres promus responsables.';
        this.loadMembers();
      },
      error: () => (this.error = 'Erreur lors de la promotion.'),
    });
  }

  demote(ids: number[]): void {
    if (!ids.length) return;
    this.classeService.demoteMembers(this.classeId, ids).subscribe({
      next: () => {
        this.actionMessage = 'Responsabilité retirée.';
        this.loadMembers();
      },
      error: () => (this.error = 'Erreur lors de la rétrogradation.'),
    });
  }

  roleLabel(role: string): string {
    return role === 'responsable' ? 'Responsable' : 'Étudiant';
  }

  roleBadgeClass(role: string): string {
    return role === 'responsable'
      ? 'badge badge-warning badge-sm'
      : 'badge badge-ghost badge-sm';
  }
}
