import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  // Récupère l'année en cours automatiquement
  currentYear: number = new Date().getFullYear();
}