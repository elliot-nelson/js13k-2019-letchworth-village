const fs = require('fs');
const PNG = require('pngjs').PNG;

/**
 * This tool takes an existing 96x96 PNG file and turns it into a javascript
 * "font" definition.
 *
 *  - Each character is 5x5 pixels
 *  - Separated by a blank row/column (so 6x6 total)
 *  - Organized into a 16x16 grid (for 256 characters)
 *  - 16*6 = 96, so 96x96 pixels
 *
 * This utility function is used during the javascript gulp build.
 */
function buildFont(pngFileName) {
  let png = PNG.sync.read(fs.readFileSync(pngFileName));
  let charmap = {};

  for (let c = 0; c < 256; c++) {
    let cx = (c % 16) * 6, cy = Math.floor(c / 16) * 6;
    let include = false;
    let glyph = [];
    let width = 0;

    for (let x = 0; x < 5; x++) {
      let red = png.data[((cy + 5) * 96 + cx + x) * 4];
      let green = png.data[((cy + 5) * 96 + cx + x) * 4 + 1];
      if (red === 255 && green === 0) {
        width = Math.max(width, x + 1);
        include = true;
      }
    }

    if (!include) continue;

    for (let y = 0; y < 5; y++) {
      let value = 0;
      for (let x = 0; x < 5; x++) {
        let black = png.data[((cy + y) * 96 + cx + x) * 4];
        value = (value << 1) | (black === 0 ? 1 : 0);
      }
      glyph.push(value);
    }

    charmap[String.fromCharCode(c)] = {
      glyph: glyph.map(x => String.fromCharCode(48 + x)).join(''),
      width: width
    };
  }

  let json = JSON.stringify(charmap, undefined, 2);
  return `const Font = ${json};`;
}

module.exports = buildFont;
