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

  shadows: any[];
  combo: number;

  bufferFrame: { dodge: number, attack: number, deflect: number };

  constructor() {
    this.x = 480 / 2;
    this.y = 270 / 2 + 30;
    this.facing = { x: 0, y: -1, m: 0 };
    this.facingAngle = Math.atan2(this.facing.y, this.facing.x);
    this.frameQ = [];
      /*{ behavior: Behavior.SPAWNING, sprite: Sprite.player_walk1 }
    ];*/
    this.powerlevel = 2000;
    this.swordframe = 0;
    this.lastPosition = [];
    this.shadows = [];
    this.combo = 0;
    this.bufferFrame = { dodge: undefined, attack: undefined, deflect: undefined };
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

    if (this.combo >= 4 && (this.shadows.length < 1 || game.frame % 5 === 0)) {
      this.shadows = [];
      this.shadows.push({
        x: Math.random() * 4 - 2,
        y: Math.random() * 4 - 2 + 2,
        s: Math.random() * 0.25 + 1,
        a: 0.3
      });
      if (this.combo >= 8 && (this.shadows.length < 2 || game.frame % 5 === 0)) {
        this.shadows.push({
          x: Math.random() * 6 - 3,
          y: Math.random() * 6 - 3 + 3,
          s: Math.random() * 0.75 + 1,
          a: 0.3
        });
      }
    }

    this.swordframe = (this.swordframe + 1) % 600;
    if (this.swordframe === 480) {
      game.screenshakes.push(new ScreenShake(28, 9, 15));
      game.hud.screenshakes.push(new ScreenShake(16, 9, 1));
      game.audio.z(2914,{length:1.5,attack:.35,modulation:1});
    }

    this.nextAnimationFrame(Animation2.player_walk);

    // Allow buffered inputs - this makes a big difference in responsiveness
    // when you are respecting cooldown frames!
    if (game.input.pressed[Input.Action.DODGE]) {
      this.bufferFrame.dodge = game.frame;
    }
    if (game.input.pressed[Input.Action.ATTACK]) {
      this.bufferFrame.attack = game.frame;
    }
    if (game.input.pressed[Input.Action.DEFLECT]) {
      this.bufferFrame.deflect = game.frame;
    }

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

      //if (game.input.pressed[Input.Action.DODGE]) {
      if (this.bufferFrame.dodge && this.bufferFrame.dodge > game.frame - 30) {
        this.bufferFrame.dodge = undefined;
        this.startAnimation(Animation2.player_dodge);
        game.audio.triggerPlayerDodged();
      //} else if (game.input.pressed[Input.Action.ATTACK]) {
      } else if (this.bufferFrame.attack && this.bufferFrame.attack > game.frame - 30) {
        this.bufferFrame.attack = undefined;
        this.startAnimation(Math.random() < 0.4 ? Animation2.player_attack_alt : Animation2.player_attack);
        game.audio.triggerPlayerAttacked();
      // don't bother buffering super
      } else if (game.input.pressed[Input.Action.SUPER] && this.powerlevel >= 9000) {
        this.startAnimation(Animation2.player_super);
        game.audio.z(57066,{length:1.8});
      //} else if (game.input.pressed[Input.Action.DEFLECT]) {
      } else if (this.bufferFrame.deflect && this.bufferFrame.deflect > game.frame - 30) {
        this.bufferFrame.deflect = undefined;
        this.startAnimation(Animation2.player_deflect);
        game.audio.triggerPlayerDeflected();
      }
    } else if (this.frame.behavior === Behavior.STUN) {
      this.next = {
        x: this.x + this.lastImpact.x * (this.frame.m || 0),
        y: this.y + this.lastImpact.y * (this.frame.m || 0)
      };
      return;
    }

    if (this.frame.behavior === Behavior.DEFLECT_COOLDOWN) {
      // Reaching a DEFLECT_COOLDOWN frame means that a deflection FAILED
      // (otherwise we would have cut the animation short and entered an ATTACK
      // frame).
      this.setCombo(0);
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

    if (this.combo >= 8) {
      motion *= 1.4;
    } else if (this.combo >= 4) {
      motion *= 1.2;
    }

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

    if (this.frame.behavior === Behavior.ATTACK && (this.frame.sprite === Sprite.player_counter1 || this.frame.sprite === Sprite.player_counter2 || this.frame.sprite === Sprite.player_counter3)) {
      ctx.save();
      ctx.rotate(Math.random() * RAD[360]);
      Sprite.drawSprite(ctx, Math.random() < 0.5 ? Sprite.player_attack3 : Sprite.player_attack2, 0, 0);
      ctx.rotate(Math.random() * RAD[360]);
      ctx.globalAlpha = 0.3;
      ctx.scale(1.9, 1.9);
      Sprite.drawSprite(ctx, Math.random() < 0.5 ? Sprite.player_attack3 : Sprite.player_attack2, 0, 0);
      ctx.restore();
    } else {
      ctx.globalAlpha = (this.frame.behavior === Behavior.DODGE ? 0.9 : 1);
      Sprite.drawSprite(ctx, this.frame.sprite, 0, 0);
      ctx.globalAlpha = 1;
    }

    if (this.frame.behavior === Behavior.DEFLECT) {
      ctx.save();
      ctx.translate(0, -9);
      ctx.rotate((game.frame / 6) % RAD[360]);
      ctx.scale(3, 3);
      Sprite.drawSprite(ctx, Sprite.star, 0, 0);
      ctx.restore();
    }

    for (let shadow of this.shadows) {
      ctx.save();
      ctx.scale(shadow.s, shadow.s);
      ctx.globalAlpha = shadow.a;
      Sprite.drawSprite(ctx, this.frame.sprite.shadow, shadow.x, shadow.y);
      ctx.restore();
    }

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
    if (this.frame.behavior === Behavior.DEFLECT) {
      this.startAnimation(Animation2.player_counter);
      game.screenshakes.push(new ScreenShake(16, 8, 8));
      return;
    }

    if (this.frame.invuln) return;

    game.audio.triggerPlayerHit();
    game.hud.screenshakes.push(new ScreenShake(16, 8, 8));
    this.setCombo(0);
    this.powerlevel -= 750;

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
    if (this.frame.sprite.hbox && this.frame.hit) {
      let sprite = this.frame.sprite;
      if (this.combo >= 8) sprite = Sprite.player_attack_rush;
      return rotatePolygon(Sprite.getHitBoxPolygon(sprite, this.x, this.y), this.facingAngle + RAD[90]);
    }
  }

  powerup(factor: number) {
    this.powerlevel += factor;
  }

  swordhungry() {
    return this.swordframe > 480;
  }

  setCombo(value: number) {
    let oldCombo = this.combo;

    if (value === 0) {
      this.combo = 0;
      this.shadows = [];
    } else {
      this.combo += value;
    }

    if (this.combo !== oldCombo && oldCombo >= 2) {
      game.hud.combot = -30;
    }
  }

  damageValue() {
    if (this.combo >= 8) return 20;
    if (this.combo >= 4) return 15;
    return 10;
  }
}
