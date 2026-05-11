import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Node } from '@antv/x6';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  // On utilise un Subject pour dire au composant "Hé, ouvre la liste des champs !"
  private openPickerSource = new Subject<{ node: Node, currentFields: any[] }>();
  openPicker$ = this.openPickerSource.asObservable();

  triggerPicker(node: Node, currentFields: any[]) {
    this.openPickerSource.next({ node, currentFields });
  }
}