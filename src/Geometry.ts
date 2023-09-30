import Phaser from "phaser";

export type Point = Phaser.Math.Vector2;

export function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function lay_on_two_sides(a: Point, b: Point, c: Point, d: Point): boolean {
  // return true if a and b lay on different sides of line c-d
  let v1 = cross(d.clone().subtract(c), a.clone().subtract(c));
  let v2 = cross(d.clone().subtract(c), b.clone().subtract(c));
  return v1 * v2 < 0;
}

export function intersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  if(Math.max(a1.x, a2.x) < Math.min(b1.x, b2.x)) return false;
  if(Math.min(a1.x, a2.x) > Math.max(b1.x, b2.x)) return false;
  if(Math.max(a1.y, a2.y) < Math.min(b1.y, b2.y)) return false;
  if(Math.min(a1.y, a2.y) > Math.max(b1.y, b2.y)) return false;
  return lay_on_two_sides(a1, a2, b1, b2) && lay_on_two_sides(b1, b2, a1, a2);
}
