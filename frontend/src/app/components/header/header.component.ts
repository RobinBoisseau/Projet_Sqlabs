import { Component, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  dropdownOpen = false;

  constructor(public router: Router, public auth: AuthService) {}

  isOnDetail(): boolean {
    return this.router.url.includes('/exercice/');
  }

  backLink(): string {
    const params = this.router.parseUrl(this.router.url).queryParams;
    if (params['classeId']) return `/classes/${params['classeId']}/exercises`;
    if (params['cours']) return `/cours/${params['cours']}`;
    return '/exercices';
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as Element).closest('.profile-menu')) {
      this.dropdownOpen = false;
    }
  }

  logout(): void {
    this.dropdownOpen = false;
    this.auth.logout();
  }
}
