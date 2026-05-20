import { Injectable } from '@angular/core';
import { Mcd } from '../models/mcd';
import { McdMemento } from '../models/mcd-memento';

// Le caretaker gère l'historique des états du MCD.
// Il conserve deux piles : une pour revenir en arrière (undo), une pour avancer (redo).
@Injectable({ providedIn: 'root' })
export class McdCaretakerService {
  private undoStack: McdMemento[] = []; // historique des états passés
  private redoStack: McdMemento[] = []; // états annulés
  private readonly MAX_HISTORY = 50; // on garde au max 50 étapes

  // Prend une photo de l'état actuel et l'empile dans l'historique
  save(mcd: Mcd): void {
    const memento = new McdMemento(JSON.stringify(mcd));
    this.undoStack.push(memento);
    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift(); // supprime le plus ancien si on dépasse la limite
    }
    // Dès qu'on fait une nouvelle action, le redo n'a plus de sens
    this.redoStack = [];
  }

  // Revient à l'état précédent et met l'état actuel dans le redo
  undo(currentMcd: Mcd): Mcd | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(new McdMemento(JSON.stringify(currentMcd)));
    const memento = this.undoStack.pop()!;
    return Mcd.fromJSON(JSON.parse(memento.state));
  }

  // Avance d'un état (l'inverse du undo) et remet l'état actuel dans le undo
  redo(currentMcd: Mcd): Mcd | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(new McdMemento(JSON.stringify(currentMcd)));
    const memento = this.redoStack.pop()!;
    return Mcd.fromJSON(JSON.parse(memento.state));
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
}