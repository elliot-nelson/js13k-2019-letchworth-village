import { game } from './Globals';
import { Input } from './input';
import { Assets, Behavior, Animation2, Sprite } from './Assets';
import { Point, NormalVector, RAD, rotatePolygon, Polygon, Circle, vectorBetween, vectorFromAngle } from './Geometry';
import { Frame } from './Assets';
import { PLAYER_WALK_SPEED } from './Config';
import { Demon1 } from './Demon1';
import { ScreenShake } from './ScreenShake';
import { spawnBloodSplatter } from './Util';
import { SuperParticle } from './Particle';
import { Tween } from './Tween';

/**
 * Player
 */
export class Player {
  x: number;
  y: number;
  next: Point;
  facing: NormalVector;
  facingAngle: number;
  lastImpact: NormalVector;

  lastPosition: Point[];

  frame: Frame;
  frameQ: Frame[];

  powerlevel: number;
  swordframe: number;

  constructor() {
    this.x = 480 / 2;
    this.y = 270 / 2 + 30;
    this.facing = { x: 0, y: -1, m: 0 };
    this.facingAngle = Math.atan2(this.facing.y, this.facing.x);
    this.frameQ = [];
      /*{ behavior: Behavior.SPAWNING, sprite: Sprite.player_walk1 }
    ];*/
    this.powerlevel = 9000; //2000; //x
    this.swordframe = 0;
    this.lastPosition = [];
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

  update() {
    this.lastPosition.unshift({ x: this.x, y: this.y });
    this.lastPosition = this.lastPosition.slice(0, 10);

    if (this.powerlevel < 0) this.powerlevel = 0;
    if (this.powerlevel < 2000) this.powerlevel += 4;

    /*if (this.frame.behavior === Behavior.SPAWNING) {
      return;
    }*/

    this.swordframe = (this.swordframe + 1) % 600;
    if (this.swordframe === 480) {
      game.screenshakes.push(new ScreenShake(28, 9, 15));
      game.hud.screenshakes.push(new ScreenShake(16, 9, 1));
      game.audio.z(2914,{length:1.5,attack:.35,modulation:1});
    }

    this.nextAnimationFrame(Animation2.player_walk);

    // Do a "first pass" behavior check, so that we can respond on *this frame*
    // to input presses. You could simplify a bit by doing a single pass, with
    // the downside that the 1st frame of the attack animation would come out on the
    // frame following the input instead of the same frame.
    if (this.frame.behavior === Behavior.DEFAULT) {
      if (game.input.direction.m > 0) {
        this.facing = game.input.direction;
        this.facingAngle = Math.atan2(this.facing.y, this.facing.x);
      } else {
        this.frame = Animation2.player_stand.frames[0];
      }

      if (game.input.pressed[Input.Action.DODGE]) {
        this.startAnimation(Animation2.player_dodge);
        game.audio.triggerPlayerDodged();
      } else if (game.input.pressed[Input.Action.ATTACK]) {
        this.startAnimation(Math.random() < 0.4 ? Animation2.player_attack_alt : Animation2.player_attack);
        game.audio.triggerPlayerAttacked();
      } else if (game.input.pressed[Input.Action.SUPER] && this.powerlevel >= 9000) {
        this.startAnimation(Animation2.player_super);
        game.audio.z(57066,{length:1.8});
      }
    } else if (this.frame.behavior === Behavior.STUN) {
      this.next = {
        x: this.x + this.lastImpact.x * (this.frame.m || 0),
        y: this.y + this.lastImpact.y * (this.frame.m || 0)
      };
      return;
    }

    if (this.frame.behavior === Behavior.SUPER_WINDUP) {
      spawnBloodSplatter(this, vectorFromAngle(Math.random() * RAD[360]), 10, 5, 40);
    }
    if (this.frame.behavior === Behavior.SUPER_FIRE) {
      game.superFired = true;
      game.particles = [];
      game.particles.push(new SuperParticle(this, this, Tween.linear, Sprite.blood_droplet2, 38));
      game.screenshakes.push(new ScreenShake(35, 18, 18));
    }

    // If only we had "this.frame.m ?? blah" :)
    let motion = this.frame.m === undefined ? (game.input.direction.m * PLAYER_WALK_SPEED) : this.frame.m;

    this.next = {
      x: this.x + this.facing.x * motion,
      y: this.y + this.facing.y * motion
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle + RAD[90]);
    ctx.globalAlpha = (this.frame.behavior === Behavior.DODGE ? 0.9 : 1);
    Sprite.drawSprite(ctx, this.frame.sprite, 0, 0);
    ctx.globalAlpha = 1;
    ctx.restore();

    if (this.frame.behavior === Behavior.DODGE) {
      ctx.save();
      ctx.translate(this.lastPosition[2].x, this.lastPosition[2].y);
      ctx.rotate(this.facingAngle + RAD[90]);
      ctx.globalAlpha = 0.7;
      Sprite.drawSprite(ctx, this.frame.sprite, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(this.lastPosition[4].x, this.lastPosition[4].y);
      ctx.rotate(this.facingAngle + RAD[90]);
      ctx.globalAlpha = 0.5;
      Sprite.drawSprite(ctx, this.frame.sprite, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(this.lastPosition[6].x, this.lastPosition[6].y);
      ctx.rotate(this.facingAngle + RAD[90]);
      ctx.globalAlpha = 0.3;
      Sprite.drawSprite(ctx, this.frame.sprite, 0, 0);
      ctx.restore();
    }

    // polygons
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
    poly = this.getHitPolygon();
    if (poly) {
      ctx.beginPath();
      for (let i = 0; i < poly.p.length; i++) {
        let [ a, b ] = [ poly.p[i], poly.p[(i+1)%poly.p.length] ];
        ctx.moveTo(poly.x + a.x, poly.y + a.y);
        ctx.lineTo(poly.x + b.x, poly.y + b.y);
      }
      ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
      ctx.stroke();
    }
    */
  }

  hitBy(impactSource: Point) {
    if (this.frame.invuln) return;

    game.audio.triggerPlayerHit();
    game.hud.screenshakes.push(new ScreenShake(16, 8, 8));
    this.powerlevel -= 900;

    let impactVector = vectorBetween(impactSource, this);
    this.lastImpact = impactVector;
    this.frameQ = Animation2.player_stun.frames.slice();
    spawnBloodSplatter(this, impactVector, 9, 5, 32);
    //spawnBloodSplatter(this, impactVector, 10, 4, 20);
  }

  noclip() {
    return this.frame.behavior === Behavior.DODGE;
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

  powerup(factor: number) {
    this.powerlevel += factor;
  }

  swordhungry() {
    return this.swordframe > 480;
  }
}
