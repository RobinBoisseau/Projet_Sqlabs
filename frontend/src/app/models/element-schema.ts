export abstract class ElementSchema {
  constructor(
    public posX: number = 0,
    public posY: number = 0,
    public width: number = 100,
    public height: number = 100
  ) {}
 
  move(x: number, y: number): void {
    this.posX = x;
    this.posY = y;
  }
 
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
 
  abstract ElementSchema(): this;
  abstract cloneElementSchema(): this;
}
 
