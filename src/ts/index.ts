import { Game } from './Game';

/**
 * Create and launch game.
 */

let game = new Game();
game.init().then(() => game.start());
