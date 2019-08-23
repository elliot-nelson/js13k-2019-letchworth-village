import { game } from "./ambient";
import { Particle } from "./Particle";

/**
 * Util
 *
 * A grab bag of exports used by other modules. Common interfaces and math
 * stuff live here.
 */

export const RAD = ((): number[] => {
  let radianTable = [];
  for (let i = 0; i <= 360; i++) {
    radianTable[i] = Math.PI * 2 * i / 360;
  }
  return radianTable;
})();
export const RAD45  = Math.PI / 4;
export const RAD90  = Math.PI / 2;
export const RAD180 = Math.PI;
export const RAD360 = Math.PI * 2;

/**
 * A "point" is a nice, generic way to express a thing with X,Y values. This
 * could be an entity's location on screen or it could represent a vector
 * (i.e. 0,0->X,Y).
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * A normal vector is expressed as X,Y (a unit vector with magnitude 1.0) plus
 * an additional magnitude value. If the vector is actually a unit vector,
 * then `m` is 1.0 as well.
 */
export interface NormalVector {
  x: number;
  y: number;
  m: number;
}

export interface Frame {
  sprite?: CanvasImageSource;
  invuln?: boolean;
  input?: boolean;
  move?: NormalVector;
  tag?: string;
  hitbox?: Hitbox;
  despawn?: boolean;
}

export interface Boundbox {
  x?: number;
  y?: number;
  r: number;
}

export interface Hitbox {
  r: number;
  a1: number;
  a2: number;
}

export interface AbsoluteHitbox extends Hitbox {
  x: number;
  y: number;
}

export function normalizeVector(p: Point): NormalVector {
  let m = Math.sqrt(p.x * p.x + p.y * p.y);
  return {
    x: p.x / m,
    y: p.y / m,
    m: m
  };
}

export function vectorFromAngle(r: number): NormalVector {
  return {
    x: Math.cos(r),
    y: Math.sin(r),
    m: 1
  };
}

export function vectorBetween(p1: Point, p2: Point): NormalVector {
  return normalizeVector({ x: p2.x - p1.x, y: p2.y - p1.y });
}

export function closestAngleTo(r1: number, r2: number): number {
  let ccw = (r1 < r2) ? r2 - r1 : (r2 + RAD360 - r1);
  let cw = ccw - RAD360;

  return Math.abs(cw) < Math.abs(ccw) ? cw : ccw;
}

export function clamp(value: number, min: number, max: number) {
  return value < min ? min : (value > max ? max : value);
}

export function angleStep(r1: number, r2: number, maxStep: number): number {
  let diff = closestAngleTo(r1, r2);
  if (Math.abs(diff) <= maxStep) return r2;

  return r1 + clamp(diff, -maxStep, maxStep);
}

export function normalizeAngle(r: number): number {
  while (r < 0) r += RAD360;
  while (r > RAD360) r -= RAD360;
  return r;
}

export function rotateVector(v: NormalVector, r: number) {
  r += Math.atan2(v.y, v.x);
  return {
    x: Math.cos(r),
    y: Math.sin(r),
    m: v.m
  };
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
}

/*

// https://gamedev.stackexchange.com/questions/7172/how-do-i-find-the-intersections-between-colliding-circles/7175#7175?newreg=0b294147a499424288dd420459e4368f
// https://web.archive.org/web/20060913155137/http://local.wasp.uwa.edu.au/~pbourke/geometry/2circle/tvoght.c
export function intersectCircleCircle(p1: Point, r1: number, p2: Point, r2: number): Point[] {
  // X distance between circle centers
  let dx = p2.x - p1.x;

  // Y distance between circle centers
  let dy = p2.y - p1.y;

  // Straight-line distance between circle centers
  let d = Math.sqrt(dy * dy + dx * dx);

  // There are no intersections if the circles are too far apart (not touching)
  if (d > r1 + r2) return [];

  // There are no intersections if one circle is inside the other
  if (d < Math.abs(r1 - r2)) return [];

  // Distance from center of first circle to midway point
  let a = (r1 * r2 - r2 * r2 + d * d) / (2 * d);

  // Calculate coordinates of midway point
  let cx = p1.x + (dx * a / d);
  let cy = p1.y + (dy * a / d);

  // Distance between computed midway point and intersection points
  let h = Math.sqrt(r1 * r1 - a * a);

  // Calculate the offset from the midway point to the intersection point
  let rx = -dy * h / d;
  let ry = dx * h / d;

  return [
    { x: cx + rx, y: cy + ry },
    { x: cx - rx, y: cy - ry }
  ];
}

export function collideCircleCircle(p1: Point, r1: number, p2: Point, r2: number): boolean {
  return distance(p1, p2) <= r1 + r2;
}

export function collideHitboxCircle(h1: AbsoluteHitbox, p2: Point, r2: number): boolean {
  let dist = distance(h1, p2);

  if (dist > h1.r + r2) return false;
  if (dist < r2) return true;

  let xpoints = intersectCircleCircle(h1, h1.r, p2, r2);
  if (xpoints.length === 0) return true;



  if (xpoints.length === 0) {
    // If there are no intersecting points, then either one circle is inside the other
    // or the circles are not touching.
    let dist = distance(h1, p2);
    return dist < r2;
  }


}
*/

export function collideHitboxCircle(h1: AbsoluteHitbox, p2: Point, r2: number): boolean {
  return distance(h1, p2) <= h1.r + r2;
}

export function rgba(r:number, g:number, b:number, a:number) {
  r = Math.floor(r);
  g = Math.floor(g);
  b = Math.floor(b);
  a = Math.floor(a * 100) / 100;
  return `rgba(${r},${g},${b},${a})`;
}

export function bakeSplatter(particle: Particle) {
  game.bloodplane.ctx.drawImage(particle.sprite, particle.x, particle.y);
}
