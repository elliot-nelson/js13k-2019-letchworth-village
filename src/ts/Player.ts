import { game } from './ambient';
import { Input } from './input';
import { Assets } from './Assets';
import { NormalVector, RAD90 } from './Util';

/**
 * Player
 */
export class Player {
  x: number;
  y: number;
  facing: NormalVector;
  facingAngle: number;

  constructor() {
    this.x = 60;
    this.y = 60;
    this.facing = { x: 0, y: -1, m: 0 };
    this.facingAngle = Math.atan2(this.facing.y, this.facing.x);
  }

  update() {
    if (game.input.direction.m > 0) {
      this.facing = game.input.direction;
      this.facingAngle = Math.atan2(this.facing.y, this.facing.x);
      this.x += this.facing.x * this.facing.m;
      this.y += this.facing.y * this.facing.m;
    }
  }

  /*
      game.input.direction.x += game.input.direc
    if (game.input.held[Input.Action.RIGHT]) {
      this.x += 1;
      console.log('right is held');
    }
    if (game.input.held[Input.Action.LEFT]) {
      this.x -= 1;
    }
    if (game.input.held[Input.Action.UP]) {
      this.y -= 1;
    }
    if (game.input.held[Input.Action.DOWN]) {
      this.y += 1;
    }
    console.log([game.input.direction.x, game.input.direction.y, game.input.direction.m]);
    */
  //}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(255, 255, 255, 255)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 16, 0, 2 * Math.PI);
    ctx.fill();

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle + RAD90);
    ctx.drawImage(Assets.player, 0, 0, 32, 32, -64, -64, 128, 128);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -50);
    ctx.stroke();
    ctx.restore();
  }
}

/*Player.State = {
  NEUTRAL: 0
};*/
