import { game } from './ambient';
import { Input } from './input';
import { Assets } from './Assets';
import { NormalVector, RAD90, RAD45, normalizeVector, vectorBetween, angleStep, RAD, vectorFromAngle, Point, distance } from './Util';

interface Frame {
  sprite?: HTMLImageElement;
  invuln?: boolean;
  input?: boolean;
  move?: NormalVector;
  tag?: string;
}

/**
 * Player demon1
 */
export class Demon1 {
  x: number;
  y: number;
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
  }

  update(): boolean {
    let currentTarget: Point;
    this.frameNumber = (this.frameNumber + 1) % 10;

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
      if (distance(this, currentTarget) < 5) this.mode = 'chase';
    }

    console.log(currentTarget);
    let diff = vectorBetween(this, currentTarget);
    let angle = Math.atan2(diff.y, diff.x);
    this.facingAngle = angleStep(this.facingAngle, angle, RAD[7]);

    let v = vectorFromAngle(this.facingAngle);
    this.x += v.x * v.m * 4;
    this.y += v.y * v.m * 4;

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    let sprites = [
      Assets.demon1,
      Assets.demon1,
      Assets.demon1,
      Assets.demon1,
      Assets.demon1,
      Assets.demon1b,
      Assets.demon1b,
      Assets.demon1b,
      Assets.demon1b,
      Assets.demon1b
    ];

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle + RAD90);
    ctx.drawImage(sprites[this.frameNumber], 0, 0, 32, 32, -64, -64, 128, 128);
    /*ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -50);
    ctx.stroke();*/
    ctx.restore();
  }
}
