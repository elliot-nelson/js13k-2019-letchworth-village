import { TweenFn, Tween } from './Tween';
import { Assets, Sprite } from './Assets';
import { game } from './Globals';
import { Point, RAD, rotateVector, vectorBetween, distance, clamp } from './Geometry';
import { spawnBloodSplatter } from './Util';

export type ParticleCallback = (particle: Particle) => void;

export class Particle {
  static bloodbath: Particle[] = [];

  p1: Point;
  p2: Point;
  tweenFn: TweenFn;
  sprite: Sprite;
  complete: ParticleCallback;
  x: number;
  y: number;
  t: number;
  d: number;
  foreground: boolean;

  constructor(p1: Point, p2: Point, tweenFn: TweenFn, sprite: Sprite, frames: number, complete?: ParticleCallback) {
    this.p1 = { x: p1.x, y: p1.y };
    this.p2 = { x: p2.x, y: p2.y };
    this.tweenFn = tweenFn;
    this.sprite = sprite;
    this.t = -1;
    this.d = frames;
    this.complete = complete;
    this.foreground = false;
  }

  update(): boolean {
    if (++this.t > this.d) {
      //if (this.complete) this.complete(this);
      //Particle.bloodbath.push(this);
      //console.log(Particle.bloodbath.length);
      //return false;

      if (this instanceof PortalParticle) {
        return false;
      }

      this.update = BloodSuckParticle.prototype.update;
      this.d = this.t + 280;
      return true;
    }

    this.x = this.tweenFn(this.t, this.p1.x, this.p2.x, this.d);
    this.y = this.tweenFn(this.t, this.p1.y, this.p2.y, this.d);

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    Sprite.drawSprite(ctx, this.sprite, this.x, this.y);
  }
}

export class GibParticle extends Particle {
  r: number;
  vr: number;

  constructor(p1: Point, p2: Point, tweenFn: TweenFn, sprite: Sprite, frames: number, complete?: ParticleCallback) {
    super(p1, p2, tweenFn, sprite, frames, complete);
    this.r = Math.random() * RAD[360];
    this.vr = (Math.random() * RAD[4] + RAD[2]) * (Math.random() < 0.5 ? 1 : -1);
  }

  update(): boolean {
    if (!super.update()) return false;

    this.r += this.vr;

    spawnBloodSplatter(this, rotateVector({ x: 1, y: 0, m: 1 }, this.r), 1, 1, 16);

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    Sprite.drawSprite(ctx, this.sprite, 0, 0);
    ctx.restore();
  }
}

export class BloodSuckParticle extends Particle {
  update(): boolean {
    if (game.player.swordhungry()) {
      this.t = this.d + 45;
    }

    if (this.t > this.d) {
      this.t++;
      let m = clamp((this.t - this.d) / 30, 0, 5);
      let v = vectorBetween(this, game.player);
      v = rotateVector(v, this.t > this.d + 150 ? RAD[20] : RAD[45]);
      this.x = this.x + v.x * m;
      this.y = this.y + v.y * m;
      if (distance(this, game.player) < 5) {
        game.player.powerup(this.sprite.img.width > 4 ? 3 : 2);
        return false;
      }
    }

    return true;
  }
}

export class PortalParticle extends Particle {
  r: number;
  vr: number;

  constructor(p1: Point, p2: Point, tweenFn: TweenFn, sprite: Sprite, frames: number, complete?: ParticleCallback) {
    super(p1, p2, tweenFn, sprite, frames);
    this.r = Math.random() * RAD[360];
    this.vr = RAD[6];
    this.foreground = true;
  }

  update(): boolean {
    if (!super.update()) return false;

    this.r += this.vr;

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    let scale = 1 - Math.abs(this.t / this.d - 0.5) * 2;
    ctx.scale(scale, scale);
    Sprite.drawSprite(ctx, this.sprite, 0, 0);
    ctx.restore();
  }

  effectiveRadius() {
    let scale = 1 - Math.abs(this.t / this.d - 0.5) * 2;
    return Math.floor(scale * 18);
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
