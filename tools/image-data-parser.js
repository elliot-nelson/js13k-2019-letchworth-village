const fs = require('fs');
const util = require('util');

/**
 * The image data parser takes a JSON file, produced by Aseprite when it exported
 * our sprite sheet, and turns it into a TypeScript file that will become part of our
 * build.
 *
 * PROS:
 *
 *  - Because the produced TS file is checked in, along with the produced spritesheet,
 *    explnatory changes to the sheet are easily visible in text diffs.
 *
 *  - The names of each frame exported become _properties_ on an exported object, giving
 *    me immediate feedback in my editor if I typo one of them (no mystery runtime errors).
 *
 *  - My already existing minification step will mangle the names of all the frames, so
 *    there's no need to worry about the original Aseprite file names taking up space.
 *
 * CONS:
 *
 *  - If you've updated images, the build is no longer pure (i.e., it has the side effect
 *    of modifying files in the /src folder that need to be checked in).
 *
 *  - Need to rebuild at least once in order to refer in source code to newly added frames.
 *
 *  - Need to be careful with your "gulp watch" filespec to avoid rebuild loops.
 *
 * For my workflow, the pros outweigh the cons.
 */
const ImageDataParser = {
  parse: function(dataFile, outputFile) {
    let data = ImageDataParser._parseDataFile(dataFile);
    ImageDataParser._writeOutputFile(data, outputFile);
  },
  _parseDataFile(dataFile) {
    let json = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    let data = {};

    for (let frame of json.frames) {
      let id = frame.filename.replace('.aseprite', '');
      let number = (parseInt(id.split(' ')[1], 10) || 0) + 1;
      id = id.split(' ')[0] + '_' + number;

      data[id] = {
        x: frame.frame.x,
        y: frame.frame.y,
        w: frame.frame.w,
        h: frame.frame.h
      };
    }

    return data;
  },
  _writeOutputFile(data, outputFile) {
    let ts = fs.readFileSync(outputFile, 'utf8');
    let lines = ts.split('\n');
    let prefix = lines.findIndex(value => value.match(/<generated>/));
    let suffix = lines.findIndex(value => value.match(/<\/generated>/));

    let generated = util.inspect(data, { compact: true });
    generated = lines.slice(0, prefix + 1).join('\n') + '\n' + generated + '\n' + lines.slice(suffix).join('\n');

    fs.writeFileSync(outputFile, generated, 'utf8');
  }
};

module.exports = ImageDataParser;
