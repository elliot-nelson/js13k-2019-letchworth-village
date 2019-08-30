import { game } from "./ambient";
import { Particle } from "./Particle";
import { Assets, Sprite } from "./Assets";
import { Tween } from "./Tween";
import { NormalVector, Point, rotateVector, RAD } from "./Geometry";

/**
 * Util
 *
 * A grab bag of exports used by other modules. Common interfaces and math
 * stuff live here.
 */

export const HEARTBEAT = 36;


export function rgba(r:number, g:number, b:number, a:number) {
  r = Math.floor(r);
  g = Math.floor(g);
  b = Math.floor(b);
  a = Math.floor(a * 100) / 100;
  return `rgba(${r},${g},${b},${a})`;
}

export function bakeSplatter(particle: Particle) {
  Sprite.drawSprite(game.bloodplanes[0][0].ctx, particle.sprite, particle.x, particle.y);
}

export function spawnBloodSplatter(p: Point, impact: NormalVector, numParticles: number, width: number, force: number) {
  for (let i = 0; i < numParticles; i++) {
    let r = Math.random() * 2 - 1;
    let source = {
      x: p.x + impact.y * width * r,
      y: p.y + impact.x * width * r
    };
    let direction = rotateVector(impact, r * RAD[90]);
    let sprite = Math.random() < 0.3 ? Sprite.blood_droplet3 : Sprite.blood_droplet2;
    let time = 12 + Math.random() * 4;
    let f = (Math.random() + 0.5) * force;
    game.particles.push(new Particle(source, { x: source.x + direction.x * f, y: source.y + direction.y * f }, Tween.easeOut4, sprite, time, bakeSplatter));
  }
}

export function nextHeartbeatAfter(frame: number) {
  let diff = frame % HEARTBEAT;
  if (diff === 0) return frame;
  return frame + (HEARTBEAT - diff);
}
