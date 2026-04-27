import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  firstName: string = 'User';
  lastName: string = 'User';

  onProfileClick() {
    console.log("Ouverture du profil... (Fonctionnalité à venir)");
    // Tu peux ajouter une alerte pour montrer que ça marche
    // alert('Bientôt vous pourrez voir votre profil !');
  }
}
