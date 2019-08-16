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

export function normalizeVector(x: number, y: number): NormalVector {
  let m = Math.sqrt(x * x + y * y);
  return {
    x: x / m,
    y: y / m,
    m: m
  };
}

export function rgba(r:number, g:number, b:number, a:number) {
  r = Math.floor(r);
  g = Math.floor(g);
  b = Math.floor(b);
  a = Math.floor(a * 100) / 100;
  return `rgba(${r},${g},${b},${a})`;
}

export const RAD360 = Math.PI * 2;
export const RAD180 = Math.PI;
export const RAD90  = Math.PI / 2;
export const RAD45  = Math.PI / 4;
