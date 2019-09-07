
export const RAD = ((): number[] => {
  let radianTable = [];
  for (let i = 0; i <= 360; i++) {
    radianTable[i] = Math.PI * 2 * i / 360;
  }
  return radianTable;
})();

/**
 * Standard 2D point.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * An AABB (bounding box) is a square represented as a point with a diagonal
 * (the distance between the center of the box and all 4 corners).
 */
export type Box = [Point, Point];

export interface Circle extends Point {
  r: number;
}

// https://gamedevelopment.tutsplus.com/tutorials/collision-detection-using-the-separating-axis-theorem--gamedev-169
// https://github.com/jriecken/sat-js/blob/master/SAT.js
// https://github.com/urgn/SAT-collisions
/**
 * A polygon is an anchor point with a series of relative points attached,
 * representing the polygon vertices.
 */
export interface Polygon extends Point {
  p: Point[]
}

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

export function angleFromVector(v: NormalVector): number {
  return Math.atan2(v.y, v.x);
}

export function closestAngleTo(r1: number, r2: number): number {
  let ccw = (r1 < r2) ? r2 - r1 : (r2 + RAD[360] - r1);
  let cw = ccw - RAD[360];

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
  while (r < 0) r += RAD[360];
  while (r > RAD[360]) r -= RAD[360];
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

/**
 * Just a shortcut method. In reality, rotating a Point is just shorthand for
 * normaling a point to a vector, rotating the vector, and then converting back.
 */
export function rotatePoint(p: Point, r: number) {
  let d = Math.sqrt(p.x * p.x + p.y * p.y);
  r += Math.atan2(p.y, p.x);
  return {
    x: Math.cos(r) * d,
    y: Math.sin(r) * d
  };
}

export function rotatePolygon(poly: Polygon, r: number) {
  return {
    x: poly.x,
    y: poly.y,
    p: poly.p.map(point => rotatePoint(point, r))
  };
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
}


/**
 * Take all points in a polygon and project them onto a straight-line plane
 * represented by the given unit vector, then return the smallest and largest
 * points along that line.
 */
function projectedPolygonMinMax(poly: Polygon, plane: NormalVector): number[] {
  let x: number, y: number, proj: number;
  let min = Infinity, max = -Infinity;

  for (let point of poly.p) {
    x = poly.x + point.x;
    y = poly.y + point.y;
    proj = (x * plane.x + y * plane.y);
    min = proj < min ? proj : min;
    max = proj > max ? proj : max;
  }

  return [min, max];
}

function getPolygonNormals(poly: Polygon): NormalVector[] {
  let a: Point, b: Point;
  let x1: number, y1: number, length: number;
  let normals: NormalVector[] = [];

  for (let i = 0; i < poly.p.length; i++) {
    a = poly.p[i];
    b = poly.p[(i + 1) % poly.p.length];
    x1 = b.y - a.y;
    y1 = -(b.x - a.x);
    length = Math.sqrt(x1 * x1 + y1 * y1);

    normals[i] = { x: x1 / length, y: y1 / length, m: 1 };
    normals[i + poly.p.length] = { x: -x1 / length, y: -y1 / length, m: 1 };
  }

  return normals;
}

export function intersectingPolygons(a: Polygon, b: Polygon) {
  let normals = getPolygonNormals(a).concat(getPolygonNormals(b));
  //console.log(normals);
  for (let normal of normals) {
    let p1 = projectedPolygonMinMax(a, normal);
    let p2 = projectedPolygonMinMax(b, normal);

    if ( ! (
      (((p1[0] <= p2[1]) && (p1[1] >= p2[0])) ||
      (p2[0] >= p1[1]) && (p2[1] >= p1[0]))
    )) {
      //console.log("not insecting", p1, p2);
      return false;
    }
  }
  return true;

  /*
  let normals = getPolygonNormals(a);
  for (let normal of normals) {
    let ap = projectedPolygonMinMax(a, normal);
    let bp = projectedPolygonMinMax(b, normal);

    if ((ap[0] >= bp[1] || ap[1] <= bp[0]) && (bp[0] <= ap[1] || bp[1] >= ap[0])) return false;
  }

  normals = getPolygonNormals(b);
  for (let normal of normals) {
    let ap = projectedPolygonMinMax(a, normal);
    let bp = projectedPolygonMinMax(b, normal);

    if ((ap[0] >= bp[1] || ap[1] <= bp[0]) && (bp[0] <= ap[1] || bp[1] >= ap[0])) return false;
  }*/
}

export function intersectingBoxes(a: Box, b: Box) {
  return (a[0].x <= b[1].x && a[1].x >= b[0].x) &&
         (a[0].y <= b[1].y && a[1].y >= b[0].y);
}

export function intersectingCircles(a: Circle, b: Circle) {
  return distance(a, b) <= a.r + b.r;
}
