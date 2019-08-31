import { Input } from './input';
import { Player } from './player';
import { Font } from './Globals';

export type Character = { width: number, glyph: string[] };
export type CharacterMap = { [key: string]: Character };

function blit(c: Character, u: number, v: number) {
  return (c.glyph[v].charCodeAt(0) - 48) & (1 << (4 - u));
}

function renderCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, c: Character, fix: boolean) {
  let cellSize = (size / 5);
  let jiggle = cellSize / 2;
  let xOffset = [1, 0.75, 0.5, 0.25, 0].map(p => p * cellSize / 2);
  //xOffset = [5, 4, 3, 2, 1];

  jiggle = 2;
  y -= size;

  ctx.lineWidth = cellSize * 0.75;
  ctx.strokeStyle = '#000000';

  ctx.beginPath();
  for (let j = 0; j < 5; j++) {
    //let yOffset = (j === 0 ? 0 : (j === 4 ? 1 : 0.5));

    for (let i = 0; i < 5; i++) {
      let right = false, down = false, left = false;

      let oldX = x, oldY = y;
      //x += ( Math.cos((i+j) / 3) - 0.5 ) * jiggle;
      //y += ( Math.sin((i+j) / 3) - 0.5 ) * jiggle;

      if (!blit(c, i, j)) continue;
      if (i < 4 && blit(c, i + 1, j)) {
        ctx.moveTo(x + (i + 0.5) * cellSize + xOffset[j], y + (j + 0.5) * cellSize);
        ctx.lineTo(x + (i + 1 + 0.5) * cellSize + xOffset[j], y + (j + 0.5) * cellSize);
        right = true;
      }
      if (j < 4 && blit(c, i, j + 1)) {
        ctx.moveTo(x + (i + 0.5) * cellSize + xOffset[j], y + (j + 0.5) * cellSize);
        ctx.lineTo(x + (i + 0.5) * cellSize + xOffset[j + 1], y + (j + 1 + 0.5) * cellSize);
        down = true;
      }
      if (i > 0 && blit(c, i - 1, j)) {
        left = true;
      }
      if (i < 4 && j < 4 && blit(c, i + 1, j + 1) && (fix || (!right && !down))) {
        ctx.moveTo(x + (i + 0.5) * cellSize + xOffset[j], y + (j + 0.5) * cellSize);
        ctx.lineTo(x + (i + 1 + 0.5) * cellSize + xOffset[j + 1], y + (j + 1 + 0.5) * cellSize);
      }
      if (i > 0 && j < 4 && blit(c, i - 1, j + 1) && (fix || (!left && !down))) {
        ctx.moveTo(x + (i + 0.5) * cellSize + xOffset[j], y + (j + 0.5) * cellSize);
        ctx.lineTo(x + (i - 1 + 0.5) * cellSize + xOffset[j + 1], y + (j + 1 + 0.5) * cellSize);
      }

      x = oldX;
      y = oldY;
    }
  }
  ctx.stroke();
}

export class Text {
  static renderText(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, text: string) {
    let pos = x;

    for (let i = 0; i < text.length; i++) {
      let c = Font[text[i]] || Font['A'];

      renderCharacter(ctx, pos, y, size, c, (text[i] === 'M' || text[i] === 'N' || text[i] === 'R'));

      pos += (c.width / 5 + 0.2) * size;
    }
  }
}
