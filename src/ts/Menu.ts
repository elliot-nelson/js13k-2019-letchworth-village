export abstract class Menu {
  state: Menu.State;

  constructor() {
    this.state = Menu.State.BIRTH;
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
