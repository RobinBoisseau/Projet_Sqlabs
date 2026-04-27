import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  imports: [CommonModule, RouterLink], // On ajoute les outils nécessaires
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  firstName: string = 'User';
  lastName: string = 'User';

  // Le constructeur doit être au début de la classe
  constructor(public router: Router) {}

  // Cette fonction renvoie "true" seulement si on est sur la page d'un exercice
  isOnDetail(): boolean {
    return this.router.url.includes('/exercice/');
  }

  onProfileClick() {
    console.log("Ouverture du profil...");
  }
}