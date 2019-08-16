const gulp = require('gulp');

// -----------------------------------------------------------------------------
// Helper Methods
//
// I prefer to name my tasks with colons (foo:bar:baz), which doesn't mesh well
// with gulp v4's preference for named functions as tasks. These helpers bridge
// the gap and keep my tasks nice and clean, even though I'm being a
// stick-in-the-mud and basically defining them "v3 style".
// -----------------------------------------------------------------------------
const tasks = {};

function task(name, fn) {
    tasks[name] = fn;
    fn.displayName = name;
}

function normalize(arg) {
    if (typeof arg === 'string') {
        if (tasks[arg]) return tasks[arg];
        throw new Error('No such task: ' + arg);
    }
    return arg;
}

function series(...args) {
    return gulp.series(...args.map(name => normalize(name)));
}

function parallel(...args) {
    return gulp.parallel(...args.map(name => normalize(name)));
}

task.exports = tasks;

module.exports = { task, series, parallel };
