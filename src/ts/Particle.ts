import { Point } from './Util';
import { TweenFn } from './Tween';

export type ParticleCallback = (particle: Particle) => void;

export class Particle {
  p1: Point;
  p2: Point;
  tweenFn: TweenFn;
  sprite: CanvasImageSource;
  complete: ParticleCallback;
  x: number;
  y: number;
  t: number;
  d: number;

  constructor(p1: Point, p2: Point, tweenFn: TweenFn, sprite: CanvasImageSource, frames: number, complete?: ParticleCallback) {
    this.p1 = { x: p1.x, y: p1.y };
    this.p2 = { x: p2.x, y: p2.y };
    this.tweenFn = tweenFn;
    this.sprite = sprite;
    this.t = -1;
    this.d = frames;
    this.complete = complete;
  }

  update(): boolean {
    if (++this.t > this.d) {
      if (this.complete) this.complete(this);
      return false;
    }

    this.x = this.tweenFn(this.t, this.p1.x, this.p2.x, this.d);
    this.y = this.tweenFn(this.t, this.p1.y, this.p2.y, this.d);

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.sprite, this.x, this.y);
  }
}

/*
class Particle {
    x: number;
    y: number;
    radius: number;
    rgba: [number, number, number, number];
    speed: number;
    ttl: number;

    constructor(x:number,y:number) {
        let r = Math.floor(Math.random() * 128) + 128;
        let b = r * 0.9;
        this.spawn(x + Math.random() * 10, y, Math.random() * 15, [r,0,b,0.4], Math.random() * 2, 20);
    }

    spawn(x: number, y: number, radius: number, rgba: [number, number, number, number], speed: number, ttl: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rgba = rgba;
        this.speed = speed;
        this.ttl = ttl;
    }

    update() {
        if (this.ttl > 0) {
            this.y--;
            this.ttl--;
            return true;
        } else {
            return false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.ttl > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = `rgba(${this.rgba.join(',')})`;
            ctx.fill();
            ctx.closePath();
        }
    }
}
*/
