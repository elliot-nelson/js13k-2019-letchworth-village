import { game } from './Globals';
import { Input } from './input';
import { Assets, Sprite, Behavior, Frame, Animation2 } from './Assets';
import { Particle, GibParticle } from './Particle';
import { Tween } from './Tween';
import { Point, NormalVector, vectorBetween, angleFromVector, clamp, vectorFromAngle, distance, RAD, Polygon, rotatePolygon, Circle, rotateVector } from './Geometry';
import { spawnBloodSplatter } from './Util';
import { HEARTBEAT, DEMON1_WALK_SPEED } from './Config';
import { ScreenShake } from './ScreenShake';

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
  framesLeft: number;

  mode: string;
  target?: Point;

  lastImpact: NormalVector;

  static lastAttackFrame: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.facing = { x: 0, y: -1, m: 0 };
    this.facingAngle = RAD[45];
    this.frameNumber = 0;
    this.mode = 'hover';
    this.hp = 19;
    this.frameQ = [];
    for (let i = 0; i < 28; i++) {
      this.frameQ.push({ behavior: Behavior.SPAWNING, sprite: Sprite.demon1_walk1 });
    }
  }

  startAnimation(animation: Animation2) {
    this.frameQ = animation.frames.slice();
    this.frame = this.frameQ.shift();
  }

  nextAnimationFrame(defaultAnimation?: Animation2) {
    if (this.frameQ.length === 0) {
      this.startAnimation(defaultAnimation);
    } else {
      this.frame = this.frameQ.shift();
    }
  }

  update(): boolean {
    this.nextAnimationFrame(Animation2.demon1_walk);


    if (this.frame.behavior !== Behavior.DYING && this.frame.behavior !== Behavior.DEAD && this.hp <= 0) {
      this.startAnimation(Animation2.demon1_death);
      game.audio.triggerEnemyKilled();
    }

    if (this.frame.behavior === Behavior.SPAWNING) {
      this.next = { x: this.x, y: this.y };
    } else if (this.frame.behavior === Behavior.DYING) {
      this.next = { x: this.x, y: this.y };
    } else if (this.frame.behavior === Behavior.DEAD) {
      let gibs = Math.random() < 0.4 ? 3 : 2;
      for (let i = 0; i < gibs; i++) {
        let v = rotateVector(this.lastImpact, Math.random() * RAD[90] - RAD[45]);
        let time = Math.floor(Math.random() * 5) + 16;
        let m = Math.random() * 65 + 30;
        let sprite = [
          Sprite.demon1_chunk1,
          Sprite.demon1_chunk2,
          Sprite.demon1_chunk3,
          Sprite.demon1_chunk4,
          Sprite.demon1_chunk5
        ][Math.floor(Math.random() * 5)];
        game.particles.push(new GibParticle(
          this,
          { x: this.x + v.x * m, y: this.y + v.y * m },
          Tween.easeOut2,
          sprite,
          time
        ));
      }
      game.screenshakes.push(new ScreenShake(15, 3, 3));
      game.stats.demonsKilled++;
      return false;
    } else
    if (this.frame.behavior === Behavior.DEFAULT) {
      this.frame.sprite = [
        Sprite.demon1_walk1,
        Sprite.demon1_walk2,
        Sprite.demon1_walk3
      ][Math.floor(game.frame / 5) % 3];

      let diff = vectorBetween(this, game.player);
      this.facingAngle = angleFromVector(diff);
      let currentTarget = {
        x: game.player.x - diff.x * game.hive.innerRingRadius,
        y: game.player.y - diff.y * game.hive.innerRingRadius
      };
      let move = vectorBetween(this, currentTarget);

      let speed = clamp(move.m, 0, 20) / 5;
      if (diff.m < game.hive.innerRingRadius) {
        speed /= 2;
      }

      this.next = {
        x: this.x + move.x * speed,
        y: this.y + move.y * speed
      };

      let sinceLastAttack = game.frame - Demon1.lastAttackFrame;
      let chance;
      if (sinceLastAttack < 5) {
        chance = 1 / 200;
      } else if (sinceLastAttack < 15) {
        chance = 1 / 100;
      } else if (sinceLastAttack < 30) {
        chance = 1 / 50;
      } else {
        chance = 1 / 20;
      }
      if ((distance(this, game.player) <= 60 && Math.random() < chance) || Math.random() < chance / 4) {
        this.frameQ = Animation2.demon1_attack.frames.slice();
      }
    } else if (this.frame.behavior === Behavior.WINDUP) {
      let v = vectorBetween(this, game.player);
      let speed = -0.5;
      this.facingAngle = angleFromVector(v);
      this.next = {
        x: this.x + v.x * speed,
        y: this.y + v.y * speed
      };
    } else if (this.frame.behavior === Behavior.ATTACK) {
      let v = vectorFromAngle(this.facingAngle);
      let speed = 5;
      this.next = {
        x: this.x + v.x * speed,
        y: this.y + v.y * speed
      };
    } else if (this.frame.behavior === Behavior.COOLDOWN) {
      let v = vectorFromAngle(this.facingAngle);
      let speed = 1;
      this.next = {
        x: this.x + v.x * speed,
        y: this.y + v.y * speed
      };
    } else if (this.frame.behavior === Behavior.STUN) {
      this.next = {
        x: this.x + this.lastImpact.x * (this.frame.m || 0),
        y: this.y + this.lastImpact.y * (this.frame.m || 0)
      };
    }

    return true;
  }

  readyToAttack() {
    let when = HEARTBEAT + 8 - 26;
    return (distance(this, game.player) <= 60 && game.frame % when === 0);
  }

  attack() {
    this.frameQ = [
      // 10
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
      // 10
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
      { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 }
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.frame.behavior === Behavior.SPAWNING) return;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle + RAD[90]);
    Sprite.drawSprite(ctx, this.frame.sprite, 0, 0);
    //Sprite.drawBoundingBox(ctx, this.frame.sprite, 0, 0);
    //Sprite.drawHitBox(ctx, this.frame.sprite, 0, 0);

    ctx.restore();

    // polys
    /*
    let poly = this.getBoundingPolygon();
    ctx.beginPath();
    for (let i = 0; i < poly.p.length; i++) {
      let [ a, b ] = [ poly.p[i], poly.p[(i+1)%poly.p.length] ];
      ctx.moveTo(poly.x + a.x, poly.y + a.y);
      ctx.lineTo(poly.x + b.x, poly.y + b.y);
    }
    ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
    ctx.stroke();
    */
  }

  hitBy(impactSource: Point) {
    if (this.frame.invuln) return;

    game.audio.triggerEnemyHit();

    this.hp -= game.player.damageValue();

    let impactVector = vectorBetween(impactSource, this);
    this.lastImpact = impactVector;
    this.frameQ = Animation2.demon1_stun.frames.slice();

    spawnBloodSplatter(this, impactVector, 10, 4, 20);
    if (game.player.combo >= 4) spawnBloodSplatter(this, impactVector, 5, 3, 40);
    if (game.player.combo >= 8) spawnBloodSplatter(this, impactVector, 5, 5, 29);
    if (game.player.combo >= 12) spawnBloodSplatter(this, impactVector, 5, 4, 35);
  }

  getBoundingPolygon(): Polygon {
    return rotatePolygon(Sprite.getBoundingBoxPolygon(this.frame.sprite, this.x, this.y), this.facingAngle + RAD[90]);
  }

  getBoundingCircle(): Circle {
    return Sprite.getBoundingCircle(this.frame.sprite, this.x, this.y);
  }

  getHitPolygon(): Polygon|undefined {
    if (this.frame.sprite.hbox) {
      return rotatePolygon(Sprite.getHitBoxPolygon(this.frame.sprite, this.x, this.y), this.facingAngle + RAD[90]);
    }
  }

  noclip() {
    return false;
  }
}

/*

    if (this.frameQ.length === 0) {
      this.frameQ = [
        { sprite: Sprite.demon1a, input: true },
        { sprite: Sprite.demon1a, input: true },
        { sprite: Sprite.demon1a, input: true },
        { sprite: Sprite.demon1b, input: true },
        { sprite: Sprite.demon1b, input: true },
        { sprite: Sprite.demon1b, input: true },
        { sprite: Sprite.demon1c, input: true },
        { sprite: Sprite.demon1c, input: true },
        { sprite: Sprite.demon1c, input: true }
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
      game.particles.push(new GibParticle(this, { x: this.x + gib1.x * m1, y: this.y + gib1.y * m1 }, Tween.easeOut2, Sprite.demon1_chunk_a, time1));
      game.particles.push(new GibParticle(this, { x: this.x + gib2.x * m2, y: this.y + gib2.y * m2 }, Tween.easeOut2, Sprite.demon1_chunk_b, time2));

      game.score += 1;
      return false;
    } else if (this.hp <= 0 && this.mode !== 'dying') {
      this.mode = 'dying';
      this.frameQ = [
        { sprite: Sprite.demon1_hit, input: false },
        { sprite: Sprite.demon1_hit, input: false },
        { sprite: Sprite.demon1_hit, input: false },
        { sprite: Sprite.demon1_hit, input: false },
        { sprite: Sprite.demon1_hit, input: false, despawn: true }
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
          { sprite: Sprite.demon1_attack1, input: false },
          { sprite: Sprite.demon1_attack1, input: false },
          { sprite: Sprite.demon1_attack1, input: false },
          { sprite: Sprite.demon1_attack1, input: false },
          { sprite: Sprite.demon1_attack1, input: false },
          { sprite: Sprite.demon1_attack1, input: false },
          { sprite: Sprite.demon1_attack1, input: false },
          { sprite: Sprite.demon1_attack1, input: false },
          { sprite: Sprite.demon1_chomp2, input: false },
          { sprite: Sprite.demon1_chomp2, input: false },
          { sprite: Sprite.demon1_chomp2, input: false },
          { sprite: Sprite.demon1_chomp2, input: false },
          { sprite: Sprite.demon1_chomp2, input: false },
          { sprite: Sprite.demon1_chomp2, input: false },
          { sprite: Sprite.demon1_chomp2, input: false },
          { sprite: Sprite.demon1_chomp2, input: false }
        ];
      }
    } else if (this.frame.move) {
      this.next = {
        x: this.x + this.frame.move.x * this.frame.move.m,
        y: this.y + this.frame.move.y * this.frame.move.m
      }
    }
*/
