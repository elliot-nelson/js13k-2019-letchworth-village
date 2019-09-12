import { game } from "./Globals";
import { rgba } from "./Util";
import { Input } from "./input";
import { ScreenShake } from "./ScreenShake";
import { RAD } from "./Geometry";

export abstract class Menu {
  state: Menu.State;
  onClose?: Function;

  constructor(options?: { onClose?: Function }) {
    this.state = Menu.State.BIRTH;

    if (options && options.onClose) this.onClose = options.onClose;
  }

  abstract update(): boolean;
  abstract draw(ctx: CanvasRenderingContext2D): void;

  focused() {
    return this.state != Menu.State.DEATH;
  }
}

export namespace Menu {
  // A menu is entering the screen, currently active, or exiting the screen. We don't
  // need "pre-birth" or "post-death" states, because at that point the object will
  // not exist anymore.
  export const enum State {
    BIRTH = 1,
    ACTIVE,
    DEATH
  }
}

export class IntroMenuA extends Menu {
  frames: number;

  constructor(options: any) {
    super(options);
    this.frames = 0;
  }

  update() {
    switch (this.state) {
      case Menu.State.BIRTH:
        this.frames++;
        if (this.frames >= 70) {
          this.state = Menu.State.ACTIVE;
        }
        break;
      case Menu.State.ACTIVE:
        if (game.input.pressed[Input.Action.ATTACK]) {
          this.state = Menu.State.DEATH;
          this.frames = 10;
        }
        break;
      case Menu.State.DEATH:
        this.frames--;
        if (this.frames < 0) {
          return false;
        }
        break;
    }

    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    let alpha: number;
    let max: number;
    if (this.state === Menu.State.BIRTH || this.state === Menu.State.ACTIVE) {
      max = 70;
      alpha = 1 - Math.min(this.frames / max, 1) * 0.66;
    } else {
      max = 10;
      alpha = Math.min(this.frames / max, 1) * 0.33;
    }
    ctx.fillStyle = rgba(0, 0, 0, alpha);
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';

    let text = [
      'Awake again. Why?',
      'The smell of demons fills the air. Send them...',
      '',
      '                      BACK TO HELL!',
      '',
      'Drink until you are full, then banish them for good.',
      '',
      '             Welcome to Letchworth Village.',
      '',
      '         PRESS [X] / (X) / (SQUARE) TO CONTINUE'
    ];

    ctx.save();
    ctx.scale(Math.min(this.frames, 10) / 10, 1);
    ctx.rotate(Math.max((10 - this.frames), 0) * -RAD[5]);
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i].toUpperCase(), 30, 50 + i * 20);
    }
    ctx.restore();
  }
}

export class IntroMenuB extends Menu {
  frames: number;

  constructor(options: any) {
    super(options);
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
        if (game.input.pressed[Input.Action.ATTACK]) {
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
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';

    let text = [
      'CONTROLS                     [KEYBOARD]   (GAMEPAD)',
      '',
      'ATTACK                       [X]        / (X) / (SQUARE)',
      'COUNTER                      [Z]        / (Y) / (TRIANGLE)',
      'DASH                         [C]        / (A) / (CROSS)',
      'FINISHER (W/FULL CHARGE)     [SPACEBAR] / (B) / (CIRCLE)',
      'CONSUME                      AUTOMATIC',
      '',
      '         PRESS [X] / (X) / (SQUARE) TO CONTINUE'
    ];

    ctx.save();
    ctx.scale(this.frames / 10, 1);
    ctx.rotate((10 - this.frames) * RAD[5]);
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i].toUpperCase(), 30, 50 + i * 20);
    }
    ctx.restore();
  }
}

export class OutroMenu extends Menu {
  frames: number;

  constructor(options: any) {
    super(options);
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
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';

    let text = [
      '',
      '',
      '       CONGRATULATIONS. YOU HAVE CLOSED THE PORTAL.',
      '',
      '',
      'The game is now over, but you can reload your browser',
      'to play again. Thanks for playing!'
    ];

    ctx.save();
    ctx.scale(this.frames / 10, 1);
    ctx.rotate((10 - this.frames) * RAD[5]);
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i].toUpperCase(), 30, 50 + i * 20);
    }
    ctx.restore();
  }
}

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
        if (game.input.pressed[Input.Action.ATTACK]) {
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
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';

    let text: string[] = [];

    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i].toUpperCase(), 30, 50 + i * 20);
    }

    /* we want a pause menu they said it will be easy they said */
    /* back in the portal with you */
  }
}
