import { Canvas } from "./Canvas";
import { rgba } from "./Util";

/**
 * Assets
 *
 * The Assets module loads raw PNGs we'll use to draw the game, does any postprocessing stuff
 * we might need to do, and then saves references to them for later.
 */
export class Assets {
  static sword: CanvasImageSource;
  static player: CanvasImageSource;
  static demon1: CanvasImageSource;
  static demon1_hit: CanvasImageSource;
  static demon1b: CanvasImageSource;

  static blood_droplet2: CanvasImageSource;
  static blood_droplet3: CanvasImageSource;

  static async init() {
    // Single PNGs
    this.sword = await this.loadImage('sword.png');
    this.player = await this.loadImage('player_stand_00.png');
    this.demon1 = await this.loadImage('demon1.png');
    this.demon1b = await this.loadImage('demon1b.png');

    // Tinted sprites
    this.demon1_hit = this.tint(this.demon1, 255, 0, 0, 0.5);

    this.blood_droplet2 = this.createBloodDroplet(2);
    this.blood_droplet3 = this.createBloodDroplet(3);
  }

  static async loadImage(uri: string): Promise<CanvasImageSource> {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = uri;
    });
  }

  static tint(source: CanvasImageSource, r: number, g: number, b: number, a: number): CanvasImageSource {
    const canvas = new Canvas(source.width as number, source.height as number);
    const ctx = canvas.ctx;

    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = rgba(r, g, b, a);
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
}
