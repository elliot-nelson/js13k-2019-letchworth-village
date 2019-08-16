import { Canvas } from './Canvas';

/**
 * Create a new "splash pattern" and return a canvas containing the pattern.
 *
 * A splash pattern is a red-yellow hued vertical gradient, with small vertical
 * randomizations, and minor black pixelated noise. In-game, we use this pattern
 * to draw text.
 */
export function createSplashPattern(width: number, height: number) {
  const canvas = new Canvas(width, height);
  const ctx = canvas.ctx;

  let gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, '#e02d10');
  gradient.addColorStop(1, '#f3ff00');
  ctx.fillStyle = gradient;

  for (let x = 0; x < width; x++) {
    let v = Math.floor(Math.random() * 15) - 5;
    ctx.translate(0, v);
    ctx.fillRect(x, 0, 1, height);
    ctx.translate(0, -v);
  }

  let noise = Math.floor((width * height) / 400);
  for (let i = 0; i < noise; i++) {
    let x = Math.floor(Math.random() * width);
    let y = Math.floor(Math.random() * height);
    ctx.fillStyle = 'rgba(0,0,0,' + (Math.floor(Math.random() * 50 + 50) / 100) + ')';
    ctx.fillRect(x, y, 1, 1);
  }

  return canvas.canvas;
}
