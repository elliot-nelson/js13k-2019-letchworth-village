import { game } from './Globals';
import { Input } from './input';
import { Assets, Behavior, Animation2, Sprite } from './Assets';
import { Point, NormalVector, RAD, rotatePolygon, Polygon, Circle, vectorBetween } from './Geometry';
import { Frame } from './Assets';
import { PLAYER_WALK_SPEED } from './Config';
import { Demon1 } from './Demon1';

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

  frame: Frame;
  frameQ: Frame[];

  constructor() {
    this.x = 60;
    this.y = 60;
    this.facing = { x: 0, y: -1, m: 0 };
    this.facingAngle = Math.atan2(this.facing.y, this.facing.x);
    this.frameQ = [];
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
        game.audio.playerDodge();
      } else if (game.input.pressed[Input.Action.ATTACK]) {
        this.startAnimation(Math.random() < 0.4 ? Animation2.player_attack_alt : Animation2.player_attack);
        game.audio.playerAttack();
      }
    } else if (this.frame.behavior === Behavior.STUN) {
      this.next = {
        x: this.x + this.lastImpact.x * (this.frame.m || 0),
        y: this.y + this.lastImpact.y * (this.frame.m || 0)
      };
      return;
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
    if (this.frame.behavior === Behavior.DODGE) {
      ctx.globalAlpha = 0.6;
    }
    Sprite.drawSprite(ctx, this.frame.sprite, 0, 0);
    ctx.globalAlpha = 1;
    ctx.restore();

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

  }

  hitBy(impactSource: Point) {
    if (this.frame.invuln) return;

    //this.hp -= 10;

    let impactVector = vectorBetween(impactSource, this);
    this.lastImpact = impactVector;
    this.frameQ = Animation2.player_stun.frames.slice();
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
}
