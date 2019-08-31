import { Input } from './input';
import { Player } from './player';
import { createSplashPattern } from './Pattern';
import { Text } from './Text';
import { ScreenShake } from './ScreenShake';
import { Hud } from './Hud';
import { game } from './Globals';
import { rgba } from './Util';
import { Menu } from './Menu';

export class PauseMenu extends Menu {
  frames: number;

  constructor() {
    super();
    this.frames = 0;
  }

  update() {
    switch (this.state) {
      case Menu.State.BIRTH:
        this.frames++;
        if (this.frames >= 10) {
          this.state = Menu.State.ACTIVE;
        }
        break;
      case Menu.State.ACTIVE:
        if (game.input.pressed[Input.Action.MENU]) {
          this.state = Menu.State.DEATH;
        }
        break;
      case Menu.State.DEATH:
        this.frames--;
        if (this.frames < 0) return false;
        break;
    }

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    let alpha = Math.min(this.frames / 10, 1) * 0.33;
    ctx.fillStyle = rgba(0, 0, 0, alpha);
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Watever', 50, 100);
  }
}
