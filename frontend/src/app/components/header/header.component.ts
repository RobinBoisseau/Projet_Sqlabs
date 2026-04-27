import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  firstName: string = 'User';
  lastName: string = 'User';

  constructor(public router: Router) {}

  isOnDetail(): boolean {
    return this.router.url.includes('/exercice/');
  }

  onProfileClick() {
    console.log("Ouverture du profil...");
  }
}