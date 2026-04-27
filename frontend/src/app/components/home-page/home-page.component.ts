import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // <--- INDISPENSABLE

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink], // <--- AJOUTE ICI
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomeComponent {}