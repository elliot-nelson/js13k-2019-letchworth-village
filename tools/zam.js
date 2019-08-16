const modifyFile = require('gulp-modify-file');

function mangle(name, table) {
    if (!table[name]) {
        let index = Object.keys(table).length;
        let newName = name.substring(0, 2) + String.fromCharCode(97 + index);
        table[name] = newName;
    } 
    return table[name];
}

function mangleShaderVars(source, reserved) {
    let regex = /([^a-zA-Z])([uav]_[a-zA-Z0-9]+)/g;
    let match;
    let table = {};

    while (match = regex.exec(source)) {
       let name = mangle(match[2], table);
       source = source.substring(0, match.index) + match[1] + name + source.substring(match.index + match[0].length);
       regex.lastIndex -= match[2].length - name.length;
    }

    console.log(table);

    Object.values(table).forEach(value => reserved.push(value));
    reserved.push('horkBooger');
    console.log(reserved);

    return source;
}

module.exports = function (reserved) {
    return modifyFile((content, path, file) => mangleShaderVars(content, reserved));
};
