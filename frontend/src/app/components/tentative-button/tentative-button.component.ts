import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tentative-button',
  standalone: true,
  imports: [],
  templateUrl: './tentative-button.component.html',
  styleUrls: ['./tentative-button.component.css']
})
export class TentativeButtonComponent {
  @Input() isDisabled: boolean = false;
  @Output() submitted = new EventEmitter<void>();

  onSend() {
    console.log('isDisabled:', this.isDisabled); 
    if (!this.isDisabled) {
      console.log('test');
      this.submitted.emit();
      console.log('après emit')
    }
  }
}
