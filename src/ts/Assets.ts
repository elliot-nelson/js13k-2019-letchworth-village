import { Canvas } from "./Canvas";
import { rgba} from "./Util";
import { Box, RAD, Point, NormalVector, Polygon, Circle } from "./Geometry";
import { PLAYER_WALK_SPEED, DEMON1_WALK_SPEED } from "./Config";
import { SpriteSheet, SpriteSheetEntry } from './ImageData-gen';

/**
 * Sprites!
 *
 * For this game, a "sprite" is a little object that has an attached image, an anchor
 * point, a bounding box, and an optional hit box. This keeps pixel-level data about
 * the image all in one place (by passing a Sprite around, we know what image to draw,
 * what point in the image to rotate around, what areas of the image can get hit by
 * things, and what areas can hit other things).
 *
 * Whether the bounding box or hitbox do anything isn't up to the Sprite, it would be
 * up to the Frame that references it. (This is helpful because it's convenient for
 * a simple game like this to have only one hit frame, but the animation may call
 * for showing the sword swipe for 5-6 frames.)
 */
export class Sprite {
  img: CanvasImageSource;
  anchor: Point;
  bbox: Box;
  hbox?: Box;
  shadow?: Sprite;

  // Player
  static player_stand = {} as Sprite;
  static player_walk1 = {} as Sprite;
  static player_walk2 = {} as Sprite;
  static player_walk3 = {} as Sprite;
  static player_walk4 = {} as Sprite;
  static player_attack1 = {} as Sprite;
  static player_attack2 = {} as Sprite;
  static player_attack3 = {} as Sprite;
  static player_stun = {} as Sprite;
  static player_dodge = {} as Sprite;
  static player_deflect = {} as Sprite;
  static player_counter1 = {} as Sprite;
  static player_counter2 = {} as Sprite;
  static player_counter3 = {} as Sprite;

  // hitbox only
  static player_attack_rush = {} as Sprite;

  // Demon1
  static demon1_walk1 = {} as Sprite;
  static demon1_walk2 = {} as Sprite;
  static demon1_walk3 = {} as Sprite;
  static demon1_attack1 = {} as Sprite;
  static demon1_attack2 = {} as Sprite;
  static demon1_stun = {} as Sprite;
  static demon1_chunk1 = {} as Sprite;
  static demon1_chunk2 = {} as Sprite;
  static demon1_chunk3 = {} as Sprite;
  static demon1_chunk4 = {} as Sprite;
  static demon1_chunk5 = {} as Sprite;

  // Blood droplets
  static blood_droplet2 = {} as Sprite;
  static blood_droplet3 = {} as Sprite;

  // Electricity
  static electric2 = {} as Sprite;
  static electric3 = {} as Sprite;
  static star = {} as Sprite;

  static tiles = [
    {}, {}, {}, {}, {}, {}, {}, {}, {}
  ] as Sprite[];

  static hud_sword_base = {} as Sprite;
  static hud_sword_outline = {} as Sprite;
  static hud_sword_hungry = {} as Sprite;
  static hud_sword_charged = {} as Sprite;

  static portal = {} as Sprite;

  /**
   * A small helper that draws a sprite onto a canvas, respecting the anchor point of
   * the sprite. Note that the canvas should be PRE-TRANSLATED and PRE-ROTATED, if
   * that's appropriate!
   */
  static drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number) {
    ctx.drawImage(sprite.img, x - sprite.anchor.x, y - sprite.anchor.y);
  }

  /**
   * Draw a sprite's bounding box, for debugging, using the same rules as drawSprite.
   */
  static drawBoundingBox(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number) {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.strokeRect(
      x - sprite.anchor.x + sprite.bbox[0].x,
      y - sprite.anchor.y + sprite.bbox[0].y,
      sprite.bbox[1].x - sprite.bbox[0].x,
      sprite.bbox[1].y - sprite.bbox[0].y
    );
  }

  /**
   * Draw a sprite's hit box, for debugging, using the same rules as drawSprite.
   */
  static drawHitBox(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number) {
    if (sprite.hbox) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.strokeRect(
        x - sprite.anchor.x + sprite.hbox[0].x,
        y - sprite.anchor.y + sprite.hbox[0].y,
        sprite.hbox[1].x - sprite.hbox[0].x,
        sprite.hbox[1].y - sprite.hbox[0].y
      );
    }
  }

  static getBoundingCircle(sprite: Sprite, x: number, y: number): Circle {
    let dx = sprite.bbox[1].x - sprite.bbox[0].x;
    let dy = sprite.bbox[1].y - sprite.bbox[0].y;
    let r = (dx > dy ? dx : dy) / 2;
    return {
      x: x - sprite.anchor.x + (sprite.bbox[0].x + sprite.bbox[1].x) / 2,
      y: y - sprite.anchor.y + (sprite.bbox[0].y + sprite.bbox[1].y) / 2,
      r
    };
  }

  static getBoundingBoxPolygon(sprite: Sprite, x: number, y: number): Polygon {
    return this.getSpriteBoxPolygon(sprite.anchor, sprite.bbox, x, y);
  }

  static getHitBoxPolygon(sprite: Sprite, x: number, y: number) {
    return this.getSpriteBoxPolygon(sprite.anchor, sprite.hbox, x, y);
  }

  static getSpriteBoxPolygon(anchor: Point, box: Box, x: number, y: number): Polygon {
    return {
      x: x,
      y: y,
      p: [
        { x: box[0].x - anchor.x, y: box[0].y - anchor.y },
        { x: box[1].x - anchor.x, y: box[0].y - anchor.y },
        { x: box[1].x - anchor.x, y: box[1].y - anchor.y },
        { x: box[0].x - anchor.x, y: box[1].y - anchor.y }
      ]
    };
  }
}

/**
 * Behaviors!
 *
 * A behavior is kind of a global state of being for entities. The idea is that any given
 * entity may or may not have "some version" of these states; you attach the desired behavior
 * to each animation frame and it is intrepreted by that entity.
 */
export const enum Behavior {
  DEFAULT = 1,
  SPAWNING,
  NEUTRAL,
  HOVER,
  WINDUP,
  ATTACK,
  COOLDOWN,
  DODGE,
  STUN,
  DEFLECT,
  DEFLECT_COOLDOWN,
  SUPER_WINDUP,
  SUPER_FIRE,
  DYING,
  DEAD
}

/**
 * Frames!
 *
 * For convenience, frames are more than just animation - an entity's current frame tells it
 * what to draw, what AI/update logic to use, and more.
 */
export interface Frame {
  hit?: boolean;
  behavior?: Behavior;
  sprite?: Sprite;
  invuln?: boolean;
  input?: boolean;
  move?: NormalVector;
  tag?: string;
  despawn?: boolean;
  m?: number;
}

/**
 * Animations!
 *
 * An animation is a sequence of frames that represents a particular action. This lets us
 * reuse frames rather than constantly instantiating new ones.
 */
export class Animation2 {
  frames: Frame[];

  static player_stand: Animation2 = { frames: [
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_stand }
  ] };
  static player_walk: Animation2 = { frames: [
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 }, // m: 4
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 }, // m: 4
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2 }
  ] };
  static player_attack: Animation2 = { frames: [
    { behavior: Behavior.WINDUP, sprite: Sprite.player_attack1, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.WINDUP, sprite: Sprite.player_attack1, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED * 3 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED * 2, hit: true },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED * 2 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack2, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk3, m: PLAYER_WALK_SPEED / 3 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk3, m: PLAYER_WALK_SPEED / 3 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk3, m: PLAYER_WALK_SPEED / 3 }
  ] };
  static player_attack_alt: Animation2 = { frames: [
    { behavior: Behavior.WINDUP, sprite: Sprite.player_walk3, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.WINDUP, sprite: Sprite.player_walk3, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack3, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack3, m: PLAYER_WALK_SPEED * 3 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack3, m: PLAYER_WALK_SPEED * 2, hit: true },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack3, m: PLAYER_WALK_SPEED * 2 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_attack3, m: PLAYER_WALK_SPEED },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk4, m: PLAYER_WALK_SPEED / 3 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk4, m: PLAYER_WALK_SPEED / 3 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_walk4, m: PLAYER_WALK_SPEED / 3 }
  ] };
  static player_dodge: Animation2 = { frames: [
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 4, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_dodge, m: 7, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_dodge, m: 8, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_dodge, m: 9, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_dodge, m: 9, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_dodge, m: 9, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_dodge, m: 8, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_dodge, m: 7, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 2, invuln: true },
    { behavior: Behavior.DODGE, sprite: Sprite.player_walk1, m: 1, invuln: true }
  ] };
  static player_stun: Animation2 = { frames: [
    { behavior: Behavior.STUN, sprite: Sprite.player_stun, invuln: true, m: PLAYER_WALK_SPEED * 3 },
    { behavior: Behavior.STUN, sprite: Sprite.player_stun, invuln: true, m: PLAYER_WALK_SPEED * 3 },
    { behavior: Behavior.STUN, sprite: Sprite.player_stun, invuln: true, m: PLAYER_WALK_SPEED * 3 },
    { behavior: Behavior.STUN, sprite: Sprite.player_stun, invuln: true, m: PLAYER_WALK_SPEED * 3 },
    { behavior: Behavior.STUN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.STUN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.STUN, sprite: Sprite.player_stun, invuln: true }
  ] };
  static player_deflect: Animation2 = { frames: [
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },

    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },

    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },

    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },

    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },
    { behavior: Behavior.DEFLECT, sprite: Sprite.player_deflect, invuln: true, m: 0 },

    { behavior: Behavior.DEFLECT_COOLDOWN, sprite: Sprite.player_deflect, m: 0 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_deflect, m: 0 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_deflect, m: 0 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_deflect, m: 0 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_deflect, m: 0 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_deflect, m: 0 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_deflect, m: 0 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_deflect, m: 0 }
  ] };
  static player_counter: Animation2 = { frames: [
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter2, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter2, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter2, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter1, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter1, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter1, invuln: true, m: 0, hit: true },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter3, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter3, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter2, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter2, invuln: true, m: 0 },
    { behavior: Behavior.ATTACK, sprite: Sprite.player_counter1, invuln: true, m: 0 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_counter1, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_counter3, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_counter3, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_counter2, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_counter2, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_counter1, invuln: true },

    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk1, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2, invuln: true },
    { behavior: Behavior.DEFAULT, sprite: Sprite.player_walk2, invuln: true }
  ] };
  static player_super: Animation2 = { frames: [
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },

    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_FIRE, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.SUPER_WINDUP, sprite: Sprite.player_stun, invuln: true },

    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },

    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },

    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.player_stun, invuln: true }
  ] };

  static demon1_walk: Animation2 = { frames: [
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk1 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk2 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk3 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk3 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk3 },
    { behavior: Behavior.DEFAULT, sprite: Sprite.demon1_walk3 }
  ] };
  static demon1_attack: Animation2 = { frames: [
    // 15
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.WINDUP, sprite: Sprite.demon1_attack1 },
    // 11
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack1 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack2, hit: true },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack2 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack2 },
    { behavior: Behavior.ATTACK, sprite: Sprite.demon1_attack2 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.demon1_attack2 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.demon1_attack2 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.demon1_attack2 },
    { behavior: Behavior.COOLDOWN, sprite: Sprite.demon1_attack2 }
  ] };
  static demon1_death: Animation2 = { frames: [
    { behavior: Behavior.DYING, sprite: Sprite.demon1_walk1, invuln: true },
    { behavior: Behavior.DYING, sprite: Sprite.demon1_walk1, invuln: true },
    { behavior: Behavior.DYING, sprite: Sprite.demon1_walk1, invuln: true },
    { behavior: Behavior.DYING, sprite: Sprite.demon1_walk1, invuln: true },
    { behavior: Behavior.DEAD, sprite: Sprite.demon1_walk1, invuln: true }
  ] };
  static demon1_stun: Animation2 = { frames: [
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 3 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 3 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 3 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 3 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 2 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 1 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 1 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 1 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true, m: DEMON1_WALK_SPEED * 1 },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun, invuln: true },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun },
    { behavior: Behavior.STUN, sprite: Sprite.demon1_stun }
  ] };
}

/**
 * Assets
 *
 * The Assets module loads raw PNGs we'll use to draw the game, does any postprocessing stuff
 * we might need to do, and then saves references to them for later.
 */
export class Assets {
  static images: { [key: string]: HTMLImageElement } = {};

  static async init() {
    let file = 'sprites-gen.png';

    await this.initSprite(Sprite.player_stand,     file, SpriteSheet.player_1, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_walk1,     file, SpriteSheet.player_2, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_walk2,     file, SpriteSheet.player_3, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_attack1,   file, SpriteSheet.player_4, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_attack2,   file, SpriteSheet.player_5, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }],
      hbox: [{ x: 14, y: 8 }, { x: 50, y: 35 }]
    });
    await this.initSprite(Sprite.player_walk3,     file, SpriteSheet.player_6, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });
    await this.initSprite(Sprite.player_attack3,   file, SpriteSheet.player_7, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }],
      hbox: [{ x: 14, y: 8 }, { x: 50, y: 35 }]
    });
    // same as walk2
    await this.initSprite(Sprite.player_walk4,     file, SpriteSheet.player_3, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }]
    });

    // The bouding box on the deflection frame is intentionally larger, because
    // the player usually WANTS to deflect an attack. Our enemy attacks are kind
    // of squirrelly so let's give the player a little bit of a nudge...
    await this.initSprite(Sprite.player_deflect,   file, SpriteSheet.player_8, {
      bbox: [{ x: 21 - 8, y: 25 - 8 }, { x: 42 + 8, y: 38 + 8 }]
    });

    // There were dedicated frames for countering but I had to golf them out. To
    // simplify the process, I'm importing a stand-in sprite and then "hack" something
    // different in the Player model.
    await this.initSprite(Sprite.player_counter1,   file, SpriteSheet.player_8, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }],
      hbox: [{ x: -12, y: -12 }, { x: 64 + 12, y: 64 + 12 }]
    });
    await this.initSprite(Sprite.player_counter2,   file, SpriteSheet.player_8, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }],
      hbox: [{ x: -12, y: -12 }, { x: 64 + 12, y: 64 + 12 }]
    });
    await this.initSprite(Sprite.player_counter3,   file, SpriteSheet.player_8, {
      bbox: [{ x: 21, y: 25 }, { x: 42, y: 38 }],
      hbox: [{ x: -12, y: -12 }, { x: 64 + 12, y: 64 + 12 }]
    });

    await this.initSprite(Sprite.demon1_walk1,     file, SpriteSheet.demon1_1);
    await this.initSprite(Sprite.demon1_walk2,     file, SpriteSheet.demon1_2);
    await this.initSprite(Sprite.demon1_walk3,     file, SpriteSheet.demon1_3);
    await this.initSprite(Sprite.demon1_attack1,   file, SpriteSheet.demon1_4, {
      bbox: [{ x: 0, y: 7 }, { x: 16, y: 22 }]
    });
    await this.initSprite(Sprite.demon1_attack2,   file, SpriteSheet.demon1_5, {
      bbox: [{ x: 0, y: 7 }, { x: 16, y: 22 }],
      hbox: [{ x: 0, y: 0 }, { x: 16, y: 10 }]
    });

    await this.initSprite(Sprite.demon1_chunk1,    file, SpriteSheet.demon1_6);
    await this.initSprite(Sprite.demon1_chunk2,    file, SpriteSheet.demon1_7);
    await this.initSprite(Sprite.demon1_chunk3,    file, SpriteSheet.demon1_8);
    await this.initSprite(Sprite.demon1_chunk4,    file, SpriteSheet.demon1_9);
    await this.initSprite(Sprite.demon1_chunk5,    file, SpriteSheet.demon1_10);

    await this.initDynamicSprite(Sprite.player_stun, this.tint(Sprite.player_walk1.img, 255, 255, 255, 0.6));
    await this.initDynamicSprite(Sprite.player_dodge, this.tint(Sprite.player_attack1.img, 96, 96, 255, 0.8));
    await this.initDynamicSprite(Sprite.demon1_stun, this.tint(Sprite.demon1_walk1.img, 255, 255, 255, 0.6));

    let sprites = [
      Sprite.player_stand,
      Sprite.player_walk1,
      Sprite.player_walk2,
      Sprite.player_walk3,
      Sprite.player_walk4,
      Sprite.player_attack1,
      Sprite.player_attack2,
      Sprite.player_attack3,
      Sprite.player_stun,
      Sprite.player_dodge,
      Sprite.player_deflect,
      Sprite.player_counter1,
      Sprite.player_counter2,
      Sprite.player_counter3
    ];
    for (let sprite of sprites) {
      sprite.shadow = {} as Sprite;
      await this.initDynamicSprite(sprite.shadow, this.tint(sprite.img, 0, 0, 0, 1));
    }

    Sprite.player_attack_rush.anchor = Sprite.player_attack2.anchor;
    Sprite.player_attack_rush.hbox = [{ x: 4, y: 2 }, { x: 60, y: 38 }];

    /*let chunks = this.cutIntoChunks(Sprite.demon1_walk2.img, RAD[24]);
    await this.initDynamicSprite(Sprite.demon1_chunk_a, chunks[0]);
    await this.initDynamicSprite(Sprite.demon1_chunk_b, chunks[1]);*/

    await this.initDynamicSprite(Sprite.blood_droplet2, this.createBloodDroplet(2));
    await this.initDynamicSprite(Sprite.blood_droplet3, this.createBloodDroplet(3));
    await this.initDynamicSprite(Sprite.electric2, this.createElectricity(2));
    await this.initDynamicSprite(Sprite.electric3, this.createElectricity(3));

    await this.initSprite(Sprite.tiles[0], file, SpriteSheet.tiles_1);
    await this.initSprite(Sprite.tiles[1], file, SpriteSheet.tiles_2);
    await this.initSprite(Sprite.tiles[2], file, SpriteSheet.tiles_3);
    await this.initSprite(Sprite.tiles[3], file, SpriteSheet.tiles_4);
    await this.initSprite(Sprite.tiles[4], file, SpriteSheet.tiles_5);
    await this.initSprite(Sprite.tiles[5], file, SpriteSheet.tiles_6);
    await this.initSprite(Sprite.tiles[6], file, SpriteSheet.tiles_7);
    await this.initSprite(Sprite.tiles[7], file, SpriteSheet.tiles_8);
    await this.initSprite(Sprite.tiles[8], file, SpriteSheet.tiles_9);

    await this.initSprite(Sprite.hud_sword_base,    file, SpriteSheet.swordmeter_1);
    await this.initSprite(Sprite.hud_sword_outline, file, SpriteSheet.swordmeter_2);
    await this.initSprite(Sprite.hud_sword_hungry,  file, SpriteSheet.swordmeter_3);
    await this.initSprite(Sprite.hud_sword_charged, file, SpriteSheet.swordmeter_4);

    await this.initSprite(Sprite.star, file, SpriteSheet.sparkle_1);
    await this.initSprite(Sprite.portal, file, SpriteSheet.portal_1);
  };

  /**
   * Initialize a sprite by loading it from a particular slice of the given image. Provides
   * "sensible" defaults for bounding box and anchor point if not provided.
   */
  static async initSprite(sprite: Sprite, uri: string, data: SpriteSheetEntry, opts?: Partial<Sprite>) {
    await this.initDynamicSprite(sprite, await this.loadSlice(uri, data.x, data.y, data.w, data.h), opts);
  }

  /**
   * Initialize a sprite by passing it a pre-defined image source (probably generated dynamically).
   * Provides "sensible" defaults for bounding box and anchor point if not provided.
   */
  static async initDynamicSprite(sprite: Sprite, source: CanvasImageSource, opts?: Partial<Sprite>) {
    let w = source.width as number;
    let h = source.height as number;

    sprite.img = source;
    sprite.anchor = (opts && opts.anchor) || { x: Math.floor(w / 2), y: Math.floor(h / 2) };
    sprite.bbox = (opts && opts.bbox) || [{ x: 0, y: 0 }, { x: w, y: h }];
    sprite.hbox = opts && opts.hbox;
  }

  /**
   * This helper method retrieves a cached image, cuts the specified slice out of it, and returns it.
   */
  static async loadSlice(uri: string, x: number, y: number, w: number, h: number): Promise<CanvasImageSource> {
    const source = await this.loadImage(uri);
    const sliceCanvas = new Canvas(w, h);
    sliceCanvas.ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    return sliceCanvas.canvas;
  }

  /**
   * This helper method loads the specified image, caching it for future use.
   */
  static async loadImage(uri: string): Promise<HTMLImageElement> {
    if (this.images[uri]) return this.images[uri];

    return await new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = uri;
      this.images[uri] = image;
    });
  }

  /**
   * Take an existing image and add an RGBA tint to it.
   */
  static tint(source: CanvasImageSource, r: number, g: number, b: number, a: number): CanvasImageSource {
    const canvas = new Canvas(source.width as number, source.height as number);
    const ctx = canvas.ctx;

    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(r, g, b, 1);
    ctx.fillRect(0, 0, source.width as number, source.height as number);

    return canvas.canvas;
  }

  /**
   * Create a blood droplet.
   */
  static createBloodDroplet(size: number) {
    const canvas = new Canvas(size, size);
    const ctx = canvas.ctx;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.fillRect(0, 0, size, size);

    return canvas.canvas;
  }

  /**
   * Create an electricity droplet.
   */
  static createElectricity(size: number) {
    const canvas = new Canvas(size, size);
    const ctx = canvas.ctx;

    ctx.fillStyle = 'rgba(128, 250, 255, 0.8)';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, 1, 1);

    return canvas.canvas;
  }

  static grayscaleNoise(width: number, height: number): Canvas {
    const canvas = new Canvas(width, height);
    for (let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        let c = Math.floor(Math.random() * 256);
        canvas.ctx.fillStyle = rgba(c, c, c, 1);
        canvas.ctx.fillRect(x, y, 1, 1);
      }
    }

    return canvas;
  }
}

export function drawPoly(ctx: CanvasRenderingContext2D, poly: Polygon) {
    ctx.beginPath();
    for (let i = 0; i < poly.p.length; i++) {
      let [ a, b ] = [ poly.p[i], poly.p[(i+1)%poly.p.length] ];
      ctx.moveTo(poly.x + a.x, poly.y + a.y);
      ctx.lineTo(poly.x + b.x, poly.y + b.y);
    }
    ctx.stroke();
}
