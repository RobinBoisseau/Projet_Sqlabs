import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.css']
})
export class PanelComponent {
  @Input() title: string = ''; // Le titre de la colonne
  @Input() scrollable: boolean = true; // Si on veut le scroll ou pas
}