import { game } from "./Game";
import { RAD, NormalVector } from "./Geometry";

export class Hive {
  frame: number;
  innerRingRadius: number;
  innerRingOffset: number;

  constructor() {
    this.frame = 0;
    this.innerRingOffset = 0;
    this.innerRingRadius = 64; // 72
  }

  update() {
    this.frame++;
    this.innerRingOffset = (this.frame * RAD[1]) % RAD[360];
  }

  draw(ctx: CanvasRenderingContext2D) {
    /*
    ctx.strokeStyle = 'rgba(0,0,255,0.3)';
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, this.innerRingRadius, 0, RAD[360]);
    ctx.stroke();

    let pos = this.getInnerRingPositions();
    for (let p of pos) {
      ctx.fillStyle = 'rgba(0,0,255,0.7)';
      ctx.fillRect(p.x * this.innerRingRadius + game.player.x, p.y * this.innerRingRadius + game.player.y, 3, 3);
    }
    */
  }

  getInnerRingPositions(): NormalVector[] {
    let pos: NormalVector[] = [];
/*
    let x1 = Math.cos(RAD[45] + this.innerRingOffset);
    let y1 = Math.sin(RAD[45] + this.innerRingOffset);
    let x2 = Math.cos(RAD[90] + this.innerRingOffset);
    let y2 = Math.sin(RAD[90] + this.innerRingOffset);

    pos.push({ x: x1, y: y1, m: 1 });
    pos.push({ x: x2, y: y2, m: 1 });

    pos.push({ x: x2, y: y2, m: 1 });
    pos.push({ x: x2, y: y2, m: 1 });*/

    // We don't have to do
    // All 8 positions can be




    for (let i = 0; i < 8; i++) {
      pos.push({
        x: Math.cos(i * RAD[45] + this.innerRingOffset),
        y: Math.sin(i * RAD[45] + this.innerRingOffset),
        m: 1
      });
    }
    return pos;
  }
}
