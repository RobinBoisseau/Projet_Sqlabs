import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Node } from '@antv/x6';

@Injectable({ providedIn: 'root' })
export class TableService {
  // On ajoute 'slug' dans l'objet transmis
  private openPickerSource = new Subject<{ node: Node, currentFields: any[], slug: string }>();
  openPicker$ = this.openPickerSource.asObservable();

  triggerPicker(node: Node, currentFields: any[], slug: string) {
    this.openPickerSource.next({ node, currentFields, slug });
  }
}