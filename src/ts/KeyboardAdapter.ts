import { Input } from './input';
import { NormalVector } from './Util';

// Just some quick constants
const A00 = 0;
const A45 = 0.7071067811865475;
const A90 = 1;

/**
 * KeyboardAdapter
 *
 * This class helps us map keyboard inputs to in-game actions.
 */
export class KeyboardAdapter {
  direction: NormalVector;
  held: Input.ActionBoolMap;
  map: Array<Input.Action>;
  private handler: Input.ActionHandler;

  constructor(handler: Input.ActionHandler) {
    // Input handler
    this.handler = handler;

    // Current button state
    this.held = {};

    // Key Mapping:             ACTION     // Key
    this.map = [];
    this.map[88] = Input.Action.ATTACK;    // [X]
    this.map[90] = Input.Action.DEFLECT;   // [Z]
    this.map[67] = Input.Action.DODGE;     // [C]
    this.map[32] = Input.Action.SUPER;     // [SPACEBAR]
    this.map[38] = Input.Action.UP;        // [UpArrow]
    this.map[40] = Input.Action.DOWN;      // [DownArrow]
    this.map[37] = Input.Action.LEFT;      // [LeftArrow]
    this.map[39] = Input.Action.RIGHT;     // [RightArrow]
    this.map[27] = Input.Action.MENU;      // [ESC]

    this.reset();
  }

  async init() {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      let k = this.map[event.keyCode];
      console.log([k, event.keyCode]);
      if (k) {
        this.held[k] = true;
      }
    });

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      let k = this.map[event.keyCode];
      if (k) {
        this.held[k] = false;
      }
    });
  }

  update() {
    // For keyboards, we want to convert the state of the various arrow keys being held down
    // into a directional vector. We use the browser's event to handle the held state of
    // the other action buttons, so we don't need to process them here.

    let state = (this.held[Input.Action.UP] ? 1 : 0) +
                (this.held[Input.Action.DOWN] ? 2 : 0) +
                (this.held[Input.Action.LEFT] ? 4 : 0) +
                (this.held[Input.Action.RIGHT] ? 8 : 0);

    // TODO: Is this as fast or as clever as I think it is? See if I can tighten this up
    // (optimize for speed and/or file size please!)
    switch (state) {
      case 0:
        this.direction = { x:  A00, y:  A00, m: 0 };
        break;
      case 1:
        this.direction = { x:  A00, y: -A90, m: 1 };
        break;
      case 2:
        this.direction = { x:  A00, y:  A90, m: 1 };
        break;
      case 3:
        this.direction = { x:  A00, y:  A00, m: 0 };
        break;
      case 4:
        this.direction = { x: -A90, y:  A00, m: 1 };
        break;
      case 5:
        this.direction = { x: -A45, y: -A45, m: 1 };
        break;
      case 6:
        this.direction = { x: -A45, y:  A45, m: 1 };
        break;
      case 7:
        this.direction = { x: -A90, y:  A00, m: 1 };
        break;
      case 8:
        this.direction = { x:  A90, y:  A00, m: 1 };
        break;
      case 9:
        this.direction = { x:  A45, y: -A45, m: 1 };
        break;
      case 10:
        this.direction = { x:  A45, y:  A45, m: 1 };
        break;
      case 11:
        this.direction = { x:  A90, y:  A00, m: 1 };
        break;
      case 12:
        this.direction = { x:  A00, y:  A00, m: 0 };
        break;
      case 13:
        this.direction = { x:  A00, y: -A90, m: 1 };
        break;
      case 14:
        this.direction = { x:  A00, y:  A90, m: 1 };
        break;
      case 15:
        this.direction = { x:  A00, y:  A00, m: 0 };
        break;
    }
  }

  private reset() {
    this.direction = { x: 0, y: 0, m: 0 };
    for (let action of Input.AllActions) {
      this.held[action] = false;
    }
  }
}
