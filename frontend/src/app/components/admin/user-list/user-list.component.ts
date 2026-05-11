import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user';

type SortColumn = 'name' | 'email' | 'role';
type SortDir    = 'asc'  | 'desc';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error = '';

  searchQuery = '';
  sortColumn: SortColumn | null = null;
  sortDir: SortDir = 'asc';

  userToDelete: User | null = null;
  deleteLoading = false;
  deleteError = '';

  constructor(private userService: UserService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: users => { this.users = users; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les utilisateurs.'; this.loading = false; }
    });
  }

  get filteredUsers(): User[] {
    let result = this.users;

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        this.roleLabel(u.role).toLowerCase().includes(q)
      );
    }

    if (this.sortColumn) {
      const col = this.sortColumn;
      const dir = this.sortDir === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => a[col].localeCompare(b[col], 'fr') * dir);
    }

    return result;
  }

  sortBy(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDir = 'asc';
    }
  }

  sortIcon(column: SortColumn): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  get adminCount(): number {
    return this.users.filter(u => u.role === 'admin').length;
  }

  isSelf(user: User): boolean {
    return user.id === this.auth.currentUser?.id;
  }

  canDelete(user: User): boolean {
    if (this.isSelf(user)) return false;
    if (user.role === 'admin' && this.adminCount <= 1) return false;
    return true;
  }

  deleteTooltip(user: User): string {
    if (this.isSelf(user)) return 'Vous ne pouvez pas supprimer votre propre compte';
    if (user.role === 'admin' && this.adminCount <= 1) return 'Impossible de supprimer le dernier administrateur';
    return 'Supprimer';
  }

  openDeleteModal(user: User): void {
    this.userToDelete = user;
    this.deleteError = '';
  }

  closeDeleteModal(): void {
    this.userToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;
    this.deleteLoading = true;
    this.deleteError = '';
    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userToDelete!.id);
        this.userToDelete = null;
        this.deleteLoading = false;
      },
      error: err => {
        this.deleteError = err.error?.message ?? 'Une erreur est survenue.';
        this.deleteLoading = false;
      }
    });
  }

  roleLabel(role: string): string {
    return ({ etudiant: 'Étudiant', professeur: 'Professeur', admin: 'Admin' } as Record<string, string>)[role] ?? role;
  }
}
