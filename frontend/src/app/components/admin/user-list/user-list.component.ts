import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error = '';

  userToDelete: User | null = null;
  deleteLoading = false;

  constructor(private userService: UserService) {}

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

  openDeleteModal(user: User): void {
    this.userToDelete = user;
  }

  closeDeleteModal(): void {
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;
    this.deleteLoading = true;
    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userToDelete!.id);
        this.userToDelete = null;
        this.deleteLoading = false;
      },
      error: () => { this.deleteLoading = false; }
    });
  }

  roleLabel(role: string): string {
    return { etudiant: 'Étudiant', professeur: 'Professeur', admin: 'Admin' }[role] ?? role;
  }
}
