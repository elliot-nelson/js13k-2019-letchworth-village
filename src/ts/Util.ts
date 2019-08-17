/**
 * Util
 *
 * A grab bag of exports used by other modules. Common interfaces and math
 * stuff live here.
 */

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

export function rgba(r:number, g:number, b:number, a:number) {
  r = Math.floor(r);
  g = Math.floor(g);
  b = Math.floor(b);
  a = Math.floor(a * 100) / 100;
  return `rgba(${r},${g},${b},${a})`;
}

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
