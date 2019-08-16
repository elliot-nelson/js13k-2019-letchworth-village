/**
 * Assets
 *
 * The Assets module loads raw PNGs we'll use to draw the game, does any postprocessing stuff
 * we might need to do, and then saves references to them for later.
 */
export class Assets {
  static sword: HTMLImageElement;
  static player: HTMLImageElement;

  static async init() {
    this.sword = await this.loadImage('sword.png');
    this.player = await this.loadImage('player_stand_00.png');
  }

  static async loadImage(uri: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = uri;
    });
  }
}
