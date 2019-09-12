import { normalizeVector, NormalVector } from './Geometry';
import { Input } from './Input';
import { game } from './Globals';

// TODO: Should these thresholds represent scale points instead of clamps?
const MIN_STICK_THRESHOLD = 0.15;
const MAX_STICK_THRESHOLD = 0.90;

/**
 * GamepadAdapter
 *
 * This class helps us map gamepad inputs to in-game actions.
 */
export class GamepadAdapter {
  direction: NormalVector;
  held: Input.ActionBoolMap;
  map: Array<Input.Action>;
  private handler: Input.ActionHandler;
  private gamepadIndex: number;

  constructor(handler : Input.ActionHandler) {
    // Input handler
    this.handler = handler;

    // Current button state
    this.held = {};

    // Button Mapping:          ACTION     // MS       Sony        Generic Pad
    this.map = [];
    this.map[2]  = Input.Action.ATTACK;    // [X]    | [SQUARE]  | (left)
    this.map[3]  = Input.Action.DEFLECT;   // [Y]    | [TRIAGLE] | (top)
    this.map[0]  = Input.Action.DODGE;     // [A]    | [CROSS]   | (bottom)
    this.map[1]  = Input.Action.SUPER;     // [B]    | [CIRCLE]  | (right)
    this.map[12] = Input.Action.UP;        // D-PAD  | "         | "
    this.map[13] = Input.Action.DOWN;      // D-PAD  | "         | "
    this.map[14] = Input.Action.LEFT;      // D-PAD  | "         | "
    this.map[15] = Input.Action.RIGHT;     // D-PAD  | "         | "
    this.map[9]  = Input.Action.MENU;      // [MENU] | [OPTIONS] | (start)

    // Gamepad connected: index=0 id=Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd), 17 buttons, 4 axes
    this.reset();
  }

  async init() {
    window.addEventListener('gamepadconnected', (event: GamepadEvent) => {
      this.gamepadIndex = event.gamepad.index;
      let gp = this.getGamepad();

      /*console.log(
        'Gamepad connected: index=%d id=%s, %d buttons, %d axes',
        gp.index,
        gp.id,
        gp.buttons.length,
        gp.axes.length
      );*/

      this.reset();

      // Hack.
      game.audio.init();
    });

    window.addEventListener("gamepaddisconnected", (event: GamepadEvent) => {
      if (this.gamepadIndex === event.gamepad.index) {
        this.gamepadIndex = undefined;
        /*console.log(
          'Gamepad disconnected: index=%d',
          event.gamepad.index
        );*/
      }

      this.reset();
    });
  }

  update() {
    // For gamepads, we do a little normalizing/clamping on the state of the thumbstick
    // to get our directional vector, and then we loop through the state of the buttons each
    // frame to get our other action buttons.

    if (this.connected()) {
      let gp = this.getGamepad();

      this.direction = normalizeVector({ x: gp.axes[0], y: gp.axes[1] });
      if (this.direction.m < MIN_STICK_THRESHOLD) {
        this.direction.m = 0;
      } else if (this.direction.m > MAX_STICK_THRESHOLD) {
        this.direction.m = 1;
      }

      for (let i = 0; i < gp.buttons.length; i++) {
        if (this.map[i]) {
          let oldValue = this.held[this.map[i]];
          let newValue = gp.buttons[i].pressed;

          if (newValue && !oldValue) {
            this.handler.onDown(this.map[i]);
          } else if (!newValue && oldValue) {
            this.handler.onUp(this.map[i]);
          }

          this.held[this.map[i]] = newValue;
        }
      }
    }
  }

  connected() {
    return this.gamepadIndex !== undefined;
  }

  private getGamepad() {
    return navigator.getGamepads()[this.gamepadIndex];
  }

  private reset() {
    this.direction = { x: 0, y: 0, m: 0 };
    for (let action of Input.AllActions) {
      this.held[action] = false;
    }
  }
}
