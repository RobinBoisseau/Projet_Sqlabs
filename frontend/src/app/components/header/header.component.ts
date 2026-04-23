import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  onLoginClick() {
    console.log('Bouton Connexion cliqué ! (Fonctionnalité en cours de développement)');
    alert('Le système de connexion sera bientôt disponible');
  }

}