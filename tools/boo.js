const fs = require('fs');
const PNG = require('pngjs').PNG;

var png = PNG.sync.read(fs.readFileSync('src/assets/font.png'));

//const charmap = [];

const charmap = {};

for (let c = 0; c < 256; c++) {
  let cx = (c % 16) * 6, cy = Math.floor(c / 16) * 6;
  let include = false;
  let glyph = [];

  for (let y = 0; y < 5; y++) {
    let value = 0;
    for (let x = 0; x < 5; x++) {
      let red = png.data[((cy + y) * 96 + cx + x) * 4];
      value = (value << 1) | (red === 0 ? 1 : 0);
    }
    glyph.push(value);
    if (value) {
      include = true;
    }
  }

  if (include) {
    charmap[String.fromCharCode(c)] = glyph.map(x => String.fromCharCode(48 + x)).join('');
  }
}

console.log(JSON.stringify(charmap, undefined, 2));
return;
/*console.log(charmap);
console.log(charmap.map(char => {
  return { set: char.set, glyph: char.glyph.map(x => String.fromCharCode(48 + x)).join('') };
}));*/

let string = '';
for (let c = 0; c < 256; c++) {
  if (!charmap[c].set) continue;

}



const Font = {
};
