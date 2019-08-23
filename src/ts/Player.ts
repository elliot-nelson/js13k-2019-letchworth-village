import { game } from './ambient';
import { Input } from './input';
import { Assets } from './Assets';
import { NormalVector, RAD90, RAD45, RAD, Point, Frame } from './Util';

/**
 * Player
 */
export class Player {
  state: Player.State;
  x: number;
  y: number;
  next: Point;
  facing: NormalVector;
  facingAngle: number;

  frame: Frame;
  frameQ: Frame[];

  constructor() {
    this.state = Player.State.NEUTRAL;
    this.x = 60;
    this.y = 60;
    this.facing = { x: 0, y: -1, m: 0 };
    this.facingAngle = Math.atan2(this.facing.y, this.facing.x);
    this.frameQ = [];
  }

  update() {
    // Grab the next scheduled frame for our player, or if one
    // doesn't exist, use a default.
    this.frame = this.frameQ.shift() || { input: true };

    if (this.frame.input) {
      if (game.input.direction.m > 0) {
        this.facing = game.input.direction;
        this.facingAngle = Math.atan2(this.facing.y, this.facing.x);
      }

      if (game.input.pressed[Input.Action.DODGE]) {
        this.frameQ.push({ move: { ...this.facing, m: 2 }, invuln: false });
        this.frameQ.push({ move: { ...this.facing, m: 4 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 6 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 7 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 7 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 2 }, invuln: false });  // 6*4 = 24, ~28

        // For debugging
        /*this.frameQ.push({ move: { ...this.facing, m: 5 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 5 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 5 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 5 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 5 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 5 }, invuln: true });
        this.frameQ.push({ move: { ...this.facing, m: 5 }, invuln: true });*/
        // End debugging

        this.frame = this.frameQ.shift();
      } else if (game.input.pressed[Input.Action.ATTACK]) {
        let hitbox = { r: 64, a1: this.facingAngle - RAD[55], a2: this.facingAngle + RAD[55] };
        this.frameQ.push({ move: { ...this.facing, m: 4 } });
        this.frameQ.push({ move: { ...this.facing, m: 2 }, hitbox });
        this.frameQ.push({ move: { ...this.facing, m: 0 }, hitbox });
        this.frameQ.push({ move: { ...this.facing, m: 0 }, hitbox });
        this.frameQ.push({ move: { ...this.facing, m: 0 }, hitbox });
        this.frameQ.push({ move: { ...this.facing, m: 0 } });

        this.frame = this.frameQ.shift();
      } else {
        this.frame.move = game.input.direction.m > 0 ? this.facing : undefined;
      }
    }

    if (this.frame.move) {
      this.next = {
        x: this.x + this.frame.move.x * this.frame.move.m * 4,
        y: this.y + this.frame.move.y * this.frame.move.m * 4
      };
    } else {
      this.next = { x: this.x, y: this.y };
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(255, 255, 255, 255)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 16, 0, 2 * Math.PI);
    ctx.fill();

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle + RAD90);
    if (this.frame.invuln) {
      ctx.globalAlpha = 0.5;
    }
    ctx.drawImage(Assets.player, 0, 0, 32, 32, -16, -16, 32, 32);
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


    ctx.translate(70, 0);
    ctx.rotate(RAD45 + RAD90);
    ctx.drawImage(Assets.sword, 0, 0, 32, 32, -16, -16, 32, 32);
    ctx.restore();

    // Hitbox
    if (this.frame.hitbox) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.75)';
      ctx.arc(this.x, this.y, this.frame.hitbox.r, this.frame.hitbox.a1, this.frame.hitbox.a2, false);
      ctx.lineTo(this.x, this.y);
      ctx.fill();
      //console.log(this.frame.hitbox);
    }

    ctx.globalAlpha = 1;
  }
}

export namespace Player {
  export const enum State {
    NEUTRAL = 1,
    DASHING = 2
  }
}
