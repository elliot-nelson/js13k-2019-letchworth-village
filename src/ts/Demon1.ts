import { game } from './ambient';
import { Input } from './input';
import { Assets } from './Assets';
import { NormalVector, RAD90, RAD45, normalizeVector, vectorBetween, angleStep, RAD, vectorFromAngle, Point, Frame, distance, bakeSplatter, rotateVector, spawnBloodSplatter, angleFromVector, clamp } from './Util';
import { Particle, GibParticle } from './Particle';
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
  hp: number;

  frame: Frame;
  frameQ: Frame[];

  frameNumber: number;

  mode: string;
  target?: Point;

  lastImpact: NormalVector;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.facing = { x: 0, y: -1, m: 0 };
    this.facingAngle = RAD45;
    this.frameNumber = 0;
    this.mode = 'hover';
    this.frameQ = [];
    this.hp = 24;
  }

  update(): boolean {
    if (this.frameQ.length === 0) {
      this.frameQ = [
        { sprite: Assets.demon1a, input: true },
        { sprite: Assets.demon1a, input: true },
        { sprite: Assets.demon1a, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1c, input: true },
        { sprite: Assets.demon1c, input: true },
        { sprite: Assets.demon1c, input: true }
      ];
    }
    this.frame = this.frameQ.shift();

    if (this.mode === 'hover') {
      let diff = vectorBetween(this, game.player);
      this.facingAngle = angleFromVector(diff);
      let currentTarget = {
        x: game.player.x - diff.x * game.hive.innerRingRadius,
        y: game.player.y - diff.y * game.hive.innerRingRadius
      };
      let move = vectorBetween(this, currentTarget);

      let speed = clamp(move.m, 0, 20) / 5;
      this.next = {
        x: this.x + move.x * speed,
        y: this.y + move.y * speed
      }
    }

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle + RAD90);
    ctx.drawImage(this.frame.sprite, -this.frame.sprite.width / 2, -this.frame.sprite.height / 2);

    ctx.restore();
    /// #if DEBUG
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
    ctx.strokeRect(this.x - this.bbox(), this.y - this.bbox(), this.bbox() * 2, this.bbox() * 2);
    /// #endif
  }

  hitBy(impactSource: Point) {
    if (this.mode === 'dying' || this.frame.invuln) return;

    this.hp -= 10;

    let impactVector = vectorBetween(impactSource, this);
    this.lastImpact = impactVector;

    this.frameQ = [
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 3 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 3 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 3 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 2 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 2 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 2 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1_hit, input: false, invuln: true, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1a, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1a, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1a, input: false, move: { ...impactVector, m: 1 } },
      { sprite: Assets.demon1a, input: true, move: { ...impactVector, m: 1 } },
    ];

/*    let numDrops = Math.floor(Math.random() * 4 + 4);
    for (let i = 0; i < numDrops; i++) {
      let x = Math.floor(Math.random() * 70 - 35) + this.x;
      let y = Math.floor(Math.random() * 70 - 35) + this.y;
      game.bloodplane.ctx.drawImage(Assets.blood_droplet, x, y);
    }*/

    spawnBloodSplatter(this, impactVector, 10, 4, 20);
  }

  bbox(): number {
    return 11;
  }
}

/*

    if (this.frameQ.length === 0) {
      this.frameQ = [
        { sprite: Assets.demon1a, input: true },
        { sprite: Assets.demon1a, input: true },
        { sprite: Assets.demon1a, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1b, input: true },
        { sprite: Assets.demon1c, input: true },
        { sprite: Assets.demon1c, input: true },
        { sprite: Assets.demon1c, input: true }
      ];
    }
    this.frame = this.frameQ.shift();

    if (this.frame.despawn) {
      let gib1 = rotateVector(this.lastImpact, Math.random() * RAD[45]);
      let gib2 = rotateVector(this.lastImpact, -(Math.random() * RAD[45]));
      let time1 = Math.floor(Math.random() * 4) + 16;
      let time2 = Math.floor(Math.random() * 4) + 16;
      let m1 = Math.random() * 60 + 30;
      let m2 = Math.random() * 60 + 30;
      game.particles.push(new GibParticle(this, { x: this.x + gib1.x * m1, y: this.y + gib1.y * m1 }, Tween.easeOut2, Assets.demon1_chunk_a, time1));
      game.particles.push(new GibParticle(this, { x: this.x + gib2.x * m2, y: this.y + gib2.y * m2 }, Tween.easeOut2, Assets.demon1_chunk_b, time2));

      game.score += 1;
      return false;
    } else if (this.hp <= 0 && this.mode !== 'dying') {
      this.mode = 'dying';
      this.frameQ = [
        { sprite: Assets.demon1_hit, input: false },
        { sprite: Assets.demon1_hit, input: false },
        { sprite: Assets.demon1_hit, input: false },
        { sprite: Assets.demon1_hit, input: false },
        { sprite: Assets.demon1_hit, input: false, despawn: true }
      ];
      this.frame = this.frameQ.shift();
    } else if (this.frame.input) {
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

      if (distance(this, currentTarget) < 40 && currentTarget === game.player) {
        this.frameQ = [
          { sprite: Assets.demon1_chomp1, input: false },
          { sprite: Assets.demon1_chomp1, input: false },
          { sprite: Assets.demon1_chomp1, input: false },
          { sprite: Assets.demon1_chomp1, input: false },
          { sprite: Assets.demon1_chomp1, input: false },
          { sprite: Assets.demon1_chomp1, input: false },
          { sprite: Assets.demon1_chomp1, input: false },
          { sprite: Assets.demon1_chomp1, input: false },
          { sprite: Assets.demon1_chomp2, input: false },
          { sprite: Assets.demon1_chomp2, input: false },
          { sprite: Assets.demon1_chomp2, input: false },
          { sprite: Assets.demon1_chomp2, input: false },
          { sprite: Assets.demon1_chomp2, input: false },
          { sprite: Assets.demon1_chomp2, input: false },
          { sprite: Assets.demon1_chomp2, input: false },
          { sprite: Assets.demon1_chomp2, input: false }
        ];
      }
    } else if (this.frame.move) {
      this.next = {
        x: this.x + this.frame.move.x * this.frame.move.m,
        y: this.y + this.frame.move.y * this.frame.move.m
      }
    }
*/
