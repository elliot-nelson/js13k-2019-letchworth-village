import { Canvas } from "./Canvas";
import { game } from "./Globals";
import { Assets, Sprite } from "./Assets";
import { RAD } from "./Geometry";

export class Hud {
  hpcanvas0: Canvas;
  hpcanvas1: Canvas;
  hpcanvas2: Canvas;
  pattern: Canvas;
  hpgradient: CanvasGradient;
  frame: number;
  heartbeatFrames: CanvasImageSource[];
  swordmeter: Canvas;

  constructor() {
    this.hpcanvas0 = new Canvas(220, 30);
    this.hpcanvas1 = new Canvas(220, 30);
    this.hpcanvas2 = new Canvas(220, 30);
    this.pattern = new Canvas(312, 312);
    this.hpgradient = this.hpcanvas0.ctx.createLinearGradient(0, 0, 0, 30);

    this.swordmeter = new Canvas(32, 116);

    this.hpgradient.addColorStop(0, '#6d0000');
    this.hpgradient.addColorStop(0.85, '#ea2a2a');
    this.hpgradient.addColorStop(1, '#aa281e');

    const hpctx1 = this.hpcanvas1.ctx;
    this.strokeHpBanner(hpctx1);
    hpctx1.fillStyle = 'white';
    hpctx1.fill();

    const hpctx2 = this.hpcanvas2.ctx;
    this.strokeHpBanner(hpctx2);
    hpctx2.strokeStyle = 'black';
    hpctx2.lineWidth = 2;
    hpctx2.stroke();

    const pctx = this.pattern.ctx;
    for (let i = 0; i < 312; i+=8) {
      for(let j = 0; j < 312; j+=8) {
        pctx.fillStyle = 'rgba(255,255,0,0.4)';
        pctx.fillRect(Math.floor(i+Math.random()*8 - 4), Math.floor(j+Math.random()*8-4), 1, 1);
      }
    }

    // A heartbeat is 32 frames
    /*this.heartbeatFrames = [
      // 10 frames
      Assets.world3,
      Assets.world2,
      Assets.world2,
      Assets.world3,
      Assets.world2,
      Assets.world2,
      Assets.world3,
      Assets.world2,
      Assets.world2,
      Assets.world3,
      // 22 frames
      Assets.world1,
      Assets.world1,
      Assets.world1,
      Assets.world1,
      Assets.world1,

      Assets.world1,
      Assets.world1,
      Assets.world1,
      Assets.world1,
      Assets.world1,

      Assets.world1,
      Assets.world1,
      Assets.world1,
      Assets.world1,
      Assets.world1,

      Assets.world1,
      Assets.world1,
      Assets.world1,
      Assets.world1,
      Assets.world1,

      Assets.world1,
      Assets.world1
    ];*/
  }

  update() {
    this.frame = this.frame || 0;
    this.frame++;
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
    ctx.drawImage(this.swordmeter.canvas, 0, 0);

    return;

    let heartbeatSprite = this.heartbeatFrames[this.frame % this.heartbeatFrames.length];

//    heartbeatSprite = Assets.world1;
    ctx.save();
    ctx.translate(10, 10);
    ctx.rotate(this.frame * RAD[1]);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(heartbeatSprite, -heartbeatSprite.width / 2, -heartbeatSprite.height / 2);
    ctx.rotate(-this.frame * RAD[1] * 2);
    ctx.drawImage(heartbeatSprite, -heartbeatSprite.width / 2, -heartbeatSprite.height / 2);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.fillText(String(game.score), 300, 10);
    return;

    const hpctx0 = this.hpcanvas0.ctx;
    const hpctx1 = this.hpcanvas1.ctx;

    hpctx0.rect(0, 0, 220, 30);
    hpctx0.fillStyle = this.hpgradient;
    hpctx0.fill();

    hpctx1.globalCompositeOperation = 'source-atop';
    hpctx1.fillStyle = 'black';
    hpctx1.fillRect(0, 0, 220, 30);

    let amt = this.frame / 300;
    let bring = Math.floor(220 * amt);
    hpctx1.drawImage(this.hpcanvas0.canvas, 0, 0, bring, 30, 0, 0, bring, 30);

    hpctx1.translate(110, 13);
    hpctx1.rotate(Math.sin(this.frame / 60) * 2);
    hpctx1.drawImage(this.pattern.canvas, -110, -110);
    hpctx1.resetTransform();

    ctx.drawImage(this.hpcanvas1.canvas, 200, 200);
    ctx.drawImage(this.hpcanvas2.canvas, 200, 200);

    /*for (let i = 0; i < 1; i++) {
      let x = 40;
      let y = 55 - (game.frame % 100);
      hpCtx.beginPath();
      hpCtx.arc(x, y, 30, 0, Math.PI * 2);
      hpCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      hpCtx.fill();
    }*/
/*
    hpctx.beginPath();
    hpctx.moveTo(200, 205);
    let lines = [
      [100, 0, 200, 5],
      [195, 9],
      [199, 12],
      [205, 15],
      [195, 20],
      [200, 25], //corner
      [100, 20, 0, 25],
      [7, 20],
      [-2, 15],
      [4, 10],
      [0, 5]
    ];
    for (let line of lines) {
      if (line.length > 2) {
        ctx.quadraticCurveTo(200 + line[0], 200+line[1], 200+line[2], 200+line[3]);
      } else {
        ctx.lineTo(200+line[0], 200+line[1]);
      }
    }
    //  ctx.quadraticCurveTo(200+100, 205 - 5, 395, 205);
    //ctx.lineTo(395, 205);
    //ctx.lineTo(395, 225 - 5);
    //ctx.lineTo(205, 225 - 5);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.drawImage(3,3,3,3,3,3
    ctx.stroke();


    //ctx.moveTo(
*/
    /*
        // Let's draw a health bar!
        ctx.rect(100, 100, 200, 20);
        var grad = ctx.createLinearGradient(100, 100, 100, 120);
        ctx.fillStyle = grad;
        ctx.fill();

        for(let i = 0; i < 1; i++) {
            let x = i + 120;
            let y = 120 - (game.frame % 30);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            let grad2 = ctx.createLinearGradient(x - 4, y - 4, x + 4, y + 4);
            grad2.addColorStop(0, 'rgba(255,255,255,0)');
            grad2.addColorStop(1, 'rgba(255,255,255,0.3)');
            ctx.fillStyle = grad2;
            ctx.fill();
        }
    */
  }

  private strokeHpBanner(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(5, 5);
    let lines = [
      [105, 0, 205, 3],
      [200, 9],
      [204, 12],
      [210, 15],
      [200, 20],
      [205, 23],
      [105, 20, 5, 25],
      [12, 20],
      [3, 15],
      [9, 10],
      [5, 5]
    ];

    for (let line of lines) {
      if (line.length > 2) {
        ctx.quadraticCurveTo(line[0], line[1], line[2], line[3]);
      } else {
        ctx.lineTo(line[0], line[1]);
      }
    }
  }
}
