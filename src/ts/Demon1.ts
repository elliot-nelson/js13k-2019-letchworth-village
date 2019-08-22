import { game } from './ambient';
import { Input } from './input';
import { Assets } from './Assets';
import { NormalVector, RAD90, RAD45, normalizeVector, vectorBetween, angleStep, RAD, vectorFromAngle, Point, Frame, distance } from './Util';
import { Particle } from './Particle';
import { Tween } from './Tween';

/**
 * Player demon1
 */
export class Demon1 {
  x: number;
  y: number;
  next: Point;
  facing: NormalVector;
  facingAngle: number;

  frame: Frame;
  frameQ: Frame[];

  frameNumber: number;

  mode: string;
  target?: Point;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.facing = { x: 0, y: -1, m: 0 };
    this.facingAngle = RAD45;
    this.frameNumber = 0;
    this.mode = 'chase';
    this.frameQ = [];
  }

  update(): boolean {
    if (this.frameQ.length === 0) {
      this.frameQ = [
        { sprite: Assets.demon1, input: true },
        { sprite: Assets.demon1, input: true },
        { sprite: Assets.demon1, input: true },
        { sprite: Assets.demon1, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1b, input: true }
      ];
    }
    this.frame = this.frameQ.shift();

    if (this.frame.input) {
      let currentTarget: Point;

      if (this.mode === 'chase') {
        if (Math.random() < 0.05) {
          this.mode = 'dart';
          this.target = undefined;
        } else {
          currentTarget = game.player;
        }
      }
      if (this.mode === 'dart') {
        if (!this.target) {
          let diff = vectorBetween(game.player, this);
          let angle = Math.atan2(diff.y, diff.x);
          angle += Math.random() * RAD[180] - RAD[90];
          let v = vectorFromAngle(angle);
          this.target = { x: game.player.x + v.x * v.m * 50, y: game.player.y + v.y * v.m * 50 };
        }
        currentTarget = this.target;
        if (distance(this, currentTarget) < 5 || Math.random() < 0.05) this.mode = 'chase';
      }

      let diff = vectorBetween(this, currentTarget);
      let angle = Math.atan2(diff.y, diff.x);
      this.facingAngle = angleStep(this.facingAngle, angle, RAD[7]);

      let v = vectorFromAngle(this.facingAngle);
      this.next = {
        x: this.x + v.x * v.m * 4,
        y: this.y + v.y * v.m * 4
      };
    } else if (this.frame.move) {
      this.next = {
        x: this.x + this.frame.move.x * this.frame.move.m,
        y: this.y + this.frame.move.y * this.frame.move.m
      }
    }

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle + RAD90);
    ctx.drawImage(this.frame.sprite, 0, 0, 32, 32, -64, -64, 128, 128);
    /*ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -50);
    ctx.stroke();*/

    /// #if DEBUG
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
    ctx.arc(0, 0, 16, 0, RAD[360]);
    ctx.stroke();
    /// #endif

    ctx.restore();
  }

  hitBy(impactSource: Point) {
    let impactVector = vectorBetween(impactSource, this);

    this.frameQ = [
      { sprite: Assets.demon1_hit, input: false, move: { ...impactVector, m: 3 } },
      { sprite: Assets.demon1_hit, input: false, move: { ...impactVector, m: 2 } },
      { sprite: Assets.demon1, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1_hit, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1_hit, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1, input: true, move: { ...impactVector, m: 1 } },
    ];

/*    let numDrops = Math.floor(Math.random() * 4 + 4);
    for (let i = 0; i < numDrops; i++) {
      let x = Math.floor(Math.random() * 70 - 35) + this.x;
      let y = Math.floor(Math.random() * 70 - 35) + this.y;
      game.bloodplane.ctx.drawImage(Assets.blood_droplet, x, y);
    }*/

    let numParticles = Math.floor(Math.random() * 4 + 4);
    for (let i = 0; i < numParticles; i++) {
      let x = Math.floor(Math.random() * 70 - 35) + this.x;
      let y = Math.floor(Math.random() * 70 - 35) + this.y;
      let time = Math.floor(Math.random() * 5 + 10);
      let sprite = Math.random() < 0.4 ? Assets.blood_droplet3 : Assets.blood_droplet2;
      game.particles.push(new Particle(this, { x, y }, Tween.easeOut4, sprite, time, saveSplatter));
    }
  }
}

function saveSplatter(particle: Particle) {
  game.bloodplane.ctx.drawImage(particle.sprite, particle.x, particle.y);
}
