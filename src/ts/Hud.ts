import { Canvas } from "./Canvas";
import { game } from "./Game";
import { Assets, Sprite } from "./Assets";
import { RAD } from "./Geometry";
import { ScreenShake } from "./ScreenShake";

export class Hud {
  hpcanvas0: Canvas;
  hpcanvas1: Canvas;
  hpcanvas2: Canvas;
  hpgradient: CanvasGradient;
  frame: number;
  heartbeatFrames: CanvasImageSource[];
  swordmeter: Canvas;

  screenshakes: ScreenShake[];

  combot: number;
  combod: number;

  constructor() {
    this.screenshakes = [];

    this.combot = 120;
    this.combod = 120;

    this.swordmeter = new Canvas(32, 116);
  }

  update() {
    this.frame = this.frame || 0;
    this.frame++;

    this.screenshakes = this.screenshakes.filter(shake => shake.update());

    this.combot++;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.swordmeter.ctx.globalCompositeOperation = 'copy';
    this.swordmeter.ctx.drawImage(Sprite.hud_sword_base.img, 0, 0);
    this.swordmeter.ctx.globalCompositeOperation = 'source-atop';

    let height = Math.floor((110 - 16 + 1) * game.player.powerlevel / 9000);
    let y = 111 - height;

    this.swordmeter.ctx.fillStyle = 'red';
    this.swordmeter.ctx.fillRect(0, y, 32, height);

    this.swordmeter.ctx.globalCompositeOperation = 'source-over';
    if (game.player.swordhungry()) {
      this.swordmeter.ctx.drawImage(Sprite.hud_sword_hungry.img, 0, 0);
    } else {
      this.swordmeter.ctx.drawImage(Sprite.hud_sword_outline.img, 0, 0);
    }
    if (game.player.powerlevel >= 9000) {
      this.swordmeter.ctx.drawImage(Sprite.hud_sword_charged.img, 0, 0);
    }

    ctx.save();
    let shakeX = 0, shakeY = 0;
    this.screenshakes.forEach(shake => {
        shakeX += shake.x;
        shakeY += shake.y;
    });
    ctx.translate(shakeX, shakeY);
    ctx.drawImage(this.swordmeter.canvas, 0, 0);
    ctx.restore();

    let alpha = Math.min(1, 1 - (this.combot / this.combod));
    if (alpha > 0) {
      ctx.globalAlpha = alpha;
      let string = String(game.player.combo) + 'x';
      let width = ctx.measureText(string).width;
      ctx.font = '20px monospace';
      ctx.fillStyle = 'rgba(240, 32, 32, 0.75)';
      ctx.fillText(string, 480 - 16 - width, 24);
      ctx.globalAlpha = 1;
    }
  }
}
