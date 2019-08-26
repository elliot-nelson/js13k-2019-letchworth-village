import { Canvas } from "./Canvas";
import { rgba, RAD } from "./Util";

type SpriteDef = { x: number, y: number, w: number, h: number };

/**
 * Assets
 *
 * The Assets module loads raw PNGs we'll use to draw the game, does any postprocessing stuff
 * we might need to do, and then saves references to them for later.
 */
export class Assets {
  static sword: CanvasImageSource;
  static player: CanvasImageSource;

  static demon1a: CanvasImageSource;
  static demon1b: CanvasImageSource;
  static demon1c: CanvasImageSource;
  static demon1_chomp1: CanvasImageSource;
  static demon1_chomp2: CanvasImageSource;
  static demon1_hit: CanvasImageSource;
  static demon1_chunk_a: CanvasImageSource;
  static demon1_chunk_b: CanvasImageSource;

  static blood_droplet2: CanvasImageSource;
  static blood_droplet3: CanvasImageSource;

  static world1: CanvasImageSource;
  static world2: CanvasImageSource;
  static world3: CanvasImageSource;

  static async init() {
    // Single PNGs
    this.sword = await this.loadImage('sword.png');
    this.player = await this.loadImage('player_stand_00.png');

    let [ demon1a, demon1b, demon1c, demon1_chomp1, demon1_chomp2 ] = await this.loadSpriteSheet('demon1.png', [
      { x: 0, y: 0, w: 16, h: 22 },
      { x: 16, y: 0, w: 16, h: 22 },
      { x: 32, y: 0, w: 16, h: 22 },
      { x: 48, y: 0, w: 16, h: 22 },
      { x: 64, y: 0, w: 16, h: 22 },
    ]);
    this.demon1a = demon1a;
    this.demon1b = demon1b;
    this.demon1c = demon1c;
    this.demon1_chomp1 = demon1_chomp1;
    this.demon1_chomp2 = demon1_chomp2;

    // Tinted sprites
    this.demon1_hit = this.tint(this.demon1a, 255, 255, 255, 0.6);

    // Chunks
    let chunk1, chunk2;
    [ chunk1, chunk2 ] = this.cutIntoChunks(this.demon1b, RAD[24]);
    this.demon1_chunk_a = chunk1;
    this.demon1_chunk_b = chunk2;

    this.blood_droplet2 = this.createBloodDroplet(2);
    this.blood_droplet3 = this.createBloodDroplet(3);

    // More stuff
    let [ world1, world2, world3 ] = await this.loadSpriteSheet('worldheartbeat2.png', [
      { x: 0, y: 0, w: 23, h: 23 },
      { x: 23, y: 0, w: 23, h: 23 },
      { x: 46, y: 0, w: 23, h: 23 }
    ]);
    Object.assign(this, { world1, world2, world3 });
  }

  static async loadImage(uri: string): Promise<CanvasImageSource> {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = uri;
    });
  }

  static async loadSpriteSheet(uri: string, sprites: SpriteDef[]): Promise<CanvasImageSource[]> {
    const source = await this.loadImage(uri);
    return sprites.map(sprite => {
      let spriteCanvas = new Canvas(sprite.w, sprite.h);
      spriteCanvas.ctx.drawImage(source, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, sprite.w, sprite.h);
      return spriteCanvas.canvas;
    });
  }

  static tint(source: CanvasImageSource, r: number, g: number, b: number, a: number): CanvasImageSource {
    const canvas = new Canvas(source.width as number, source.height as number);
    const ctx = canvas.ctx;

    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(r, g, b, 1);
    ctx.fillRect(0, 0, source.width as number, source.height as number);

    return canvas.canvas;
  }

  static createBloodDroplet(size: number) {
    const canvas = new Canvas(size, size);
    const ctx = canvas.ctx;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.fillRect(0, 0, size, size);

    return canvas.canvas;
  }

  static cutIntoChunks(source: CanvasImageSource, angle: number): CanvasImageSource[] {
    let width = source.width as number, height = source.height as number;
    const canvas = [
      new Canvas(width, height),
      new Canvas(width, height)
    ];
    const ctx = [canvas[0].ctx, canvas[1].ctx];
    angle = angle % RAD[180];

    let cutLength = width + height;
    let cut = [
      { x: width / 2 + Math.cos(angle) * cutLength, y: height / 2 - Math.sin(angle) * cutLength },
      { x: width / 2 - Math.cos(angle) * cutLength, y: height / 2 + Math.sin(angle) * cutLength }
    ];

    ctx[0].drawImage(source, 0, 0);
    ctx[0].globalCompositeOperation = 'destination-in';
    ctx[0].moveTo(cut[0].x, cut[0].y);
    ctx[0].lineTo(cut[1].x, cut[1].y);
    ctx[0].lineTo(width, height);
    ctx[0].lineTo(width, 0);
    ctx[0].closePath();
    ctx[0].fill();

    ctx[1].drawImage(source, 0, 0);
    ctx[1].globalCompositeOperation = 'destination-out';
    ctx[1].moveTo(cut[0].x, cut[0].y);
    ctx[1].lineTo(cut[1].x, cut[1].y);
    ctx[1].lineTo(width, height);
    ctx[1].lineTo(width, 0);
    ctx[1].closePath();
    ctx[1].fill();

    return [canvas[0].canvas, canvas[1].canvas];
  }
}
