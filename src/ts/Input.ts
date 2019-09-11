import { KeyboardAdapter } from './KeyboardAdapter';
import { GamepadAdapter } from './GamepadAdapter';
import { NormalVector } from './Geometry';

/**
 * This is our primary game input handler. Every frame, we'll be asking it for an update,
 * which will in turn get data from any supported input adapters and coalesce it into
 * a set of game inputs that the rest of that frame's update step will use.
 */
export class Input implements Input.ActionHandler {
    // The _direction input_ represents the movement input the user is
    // pressing, separate from the actual pressing/releasing of inputs.
    // It is represented as a vector, e.g., if the user is holding down
    // the "right" key the direction is [1, 0, 1].
    direction: NormalVector;

    // When an input is _pressed_, it means that the input was hit THIS
    // FRAME. This value will be cleared on the next frame.
    pressed: Input.ActionBoolMap;

    // When an input is _released_, it means that the input was let go
    // THIS FRAME. This value will be cleared on the next frame.
    released: Input.ActionBoolMap;

    // An input is _held_ any time the user is pressing it.
    held: Input.ActionBoolMap;

    // The frames held value keeps track of how many frames an input has
    // been held down by the player. If [held] is true, then this is the
    // duration the user has been holding the input; if [held] is false,
    // it represents the LAST duration.
    framesHeld: Input.ActionIntMap;

    private keyboard: KeyboardAdapter;
    private gamepad: GamepadAdapter;

    async init() {
        this.pressed = {};
        this.released = {};
        this.held = {};
        this.framesHeld = {};

        this.keyboard = new KeyboardAdapter(this);
        await this.keyboard.init();

        this.gamepad = new GamepadAdapter(this);
        await this.gamepad.init();
    }

    update() {
        // We could have some kind of "input adapter toggle", but it's easier to just treat all inputs
        // as valid -- if you're pressing the "attack" button on either gamepad or keyboard, then you're
        // attacking. For directional input, we instead check whether there's movement on the thumbstick,
        // and we use it if there is -- otherwise we try to extract movement from the keyboard instead.

        this.keyboard.update();
        this.gamepad.update();

        for (let action of Input.AllActions) {
            let held = this.gamepad.held[action] || this.keyboard.held[action];
            this.pressed[action] = !this.held[action] && held;
            this.released[action] = this.held[action] && !held;

            if (this.pressed[action]) {
                this.framesHeld[action] = 1;
            } else if (this.held[action] && held) {
                this.framesHeld[action]++;
            }

            this.held[action] = held;
        }

        this.direction = this.gamepad.direction.m > 0 ? this.gamepad.direction : this.keyboard.direction;
    }

    onDown(action: Input.Action) {
    }

    onUp(action: Input.Action) {
    }
}

export namespace Input {
    /*
     * The Action enum is a list of the in-game actions that we can respond to. The physical
     * keys or buttons that the user presses to trigger these in-game actions are then
     * controlled by the input adapters.
     */
    export const enum Action {
        // Note that moving the player around is actually not considered an action; it's
        // a separate non-action input called "direction". It just so happens that on
        // keyboard, for example, pressing the "down arrow" key is considered both a
        // press of the in-game DOWN action and a directional input. It's up to the input
        // consumer to decide which input is relevant (if any). For example, on a menu,
        // we may consume the DOWN/UP actions to navigate the menu, but ignore directional
        // inputs.
        //
        // Cheap trick: always start const enums with 1, because then the rest of your
        // lazy code can evaluate `if (action) {` for truthiness.
        UP = 1,
        DOWN,
        LEFT,
        RIGHT,
        ATTACK,
        DEFLECT,
        DODGE,
        SUPER,
        MENU,
        MUTE
    }

    export const AllActions: Input.Action[] = [
        Input.Action.UP,
        Input.Action.DOWN,
        Input.Action.LEFT,
        Input.Action.RIGHT,
        Input.Action.ATTACK,
        Input.Action.DEFLECT,
        Input.Action.DODGE,
        Input.Action.SUPER,
        Input.Action.MENU,
        Input.Action.MUTE
    ];

    export type ActionBoolMap = { [key in Input.Action]?: boolean };
    export type ActionIntMap = { [key in Input.Action]?: number };

    export interface ActionHandler {
        onDown: (action: Input.Action) => void;
        onUp: (action: Input.Action) => void;
    }
}
