import { Game } from './Game';
import { CharacterMap } from './Text';

/**
 * Ambient declarations / type definitions.
 */
declare let game: Game;

declare const Font: CharacterMap;

declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}
