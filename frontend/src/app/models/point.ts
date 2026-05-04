export class Point {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}
 
  static fromJSON(data: any): Point {
    return new Point(data.x, data.y);
  }
}
 
