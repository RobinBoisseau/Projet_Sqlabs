// Le memento est une photo de l'état du MCD à un instant T.
// On s'en sert pour pouvoir revenir en arrière (undo) ou avancer (redo).
export class McdMemento {
  constructor(
    public readonly state: string, // le MCD sérialisé en JSON
    public readonly timestamp: Date = new Date() // quand la photo a été prise
  ) {}
}