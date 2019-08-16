// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------
const advpng            = require('imagemin-advpng');
const fs                = require('fs');
const glob              = require('glob');
const gulp              = require('gulp');

const buildFont         = require('./tools/build-font');

// -----------------------------------------------------------------------------
// Gulp Plugins
// -----------------------------------------------------------------------------
const add               = require('gulp-add');
const advzip            = require('gulp-advzip');
const concat            = require('gulp-concat');
const cleancss          = require('gulp-clean-css');
const htmlmin           = require('gulp-htmlmin');
const ifdef             = require('gulp-ifdef');
const imagemin          = require('gulp-imagemin');
const size              = require('gulp-size');
const sourcemaps        = require('gulp-sourcemaps');
const stripImportExport = require('gulp-strip-import-export');
const template          = require('gulp-template');
const terser            = require('gulp-terser');
const typescript        = require('gulp-typescript');
const zip               = require('gulp-zip');

// -----------------------------------------------------------------------------
// Gulpfile
// -----------------------------------------------------------------------------
const { task, series, parallel } = require('./gulptask');
module.exports = task.exports;

// -----------------------------------------------------------------------------
// JS Build
// -----------------------------------------------------------------------------
const sources = glob.sync('src/ts/**/*.ts').sort((a, b) => {
    // We put ambient typedefs at the top of the source list
    if (a === 'src/ts/ambient.d.ts') return -1;
    if (b === 'src/ts/ambient.d.ts') return 1;

    // The game loader goes at the bottom of the source list
    if (a === 'src/ts/index.ts') return 1;
    if (b === 'src/ts/index.ts') return -1;

    // Everything else can be loaded in any order
    return a.localeCompare(b);
});
const tsdev = typescript.createProject('tsconfig.json');
const tsprod = typescript.createProject('tsconfig.json');
task('build:js:font', () => {
    return gulp.src('src/assets/font.png')
        .pipe(add('Font.js', buildFont('src/assets/font.png'), true))
        .pipe(gulp.dest('dist/temp'));
});
task('build:js:dev', () => {
    console.log(sources);
    return gulp.src(sources)
        .pipe(sourcemaps.init())
        .pipe(tsdev())
        .pipe(stripImportExport())
        .pipe(gulp.src('dist/temp/Font.js'))
        //.pipe(ifdef({ DEBUG: true }, { extname: ['js'], verbose: false }))
        .pipe(concat('app.dev.js'))
        //.pipe(terser())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/temp'));
});
task('build:js:prod', () => {
    return gulp.src(sources)
        .pipe(sourcemaps.init())
        .pipe(tsprod()).js
        .pipe(stripImportExport())
        .pipe(gulp.src('dist/temp/Font.js'))
        //.pipe(ifdef({ DEBUG: false }, { extname: ['js'], verbose: false }))
        .pipe(concat('app.prod.js'))
        .pipe(terser())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/temp'));
});
task('build:js', series('build:js:font', parallel('build:js:dev', 'build:js:prod')));
//task('build:js', parallel('build:js:dev'));

// -----------------------------------------------------------------------------
// CSS Build
// -----------------------------------------------------------------------------
task('build:css', () => {
    return gulp.src('src/css/*.css')
        .pipe(concat('app.css'))
        .pipe(cleancss())
        .pipe(gulp.dest('dist/temp'));
});

// -----------------------------------------------------------------------------
// Assets Build
// -----------------------------------------------------------------------------
task('build:assets:dev', () => {
    return gulp.src('src/assets/*.png')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/dev'));
});
task('build:assets:prod', () => {
    return gulp.src('src/assets/*.png')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/prod'));
});
task('build:assets', parallel('build:assets:dev', 'build:assets:prod'));

// -----------------------------------------------------------------------------
// HTML Build
// -----------------------------------------------------------------------------
task('build:html:dev', () => {
    const cssContent = fs.readFileSync('dist/temp/app.css');
    const jsContent = fs.readFileSync('dist/temp/app.dev.js');

    return gulp.src('src/index.html')
        .pipe(template({ css: cssContent, js: jsContent }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist/dev'));
});
task('build:html:prod', () => {
    const cssContent = fs.readFileSync('dist/temp/app.css');
    const jsContent = fs.readFileSync('dist/temp/app.prod.js');

    return gulp.src('src/index.html')
        .pipe(template({ css: cssContent, js: jsContent }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist/prod'));
});
task('build:html', parallel('build:html:dev', 'build:html:prod'));

// -----------------------------------------------------------------------------
// ZIP Build
// -----------------------------------------------------------------------------
task('build:zip', () => {
    return gulp.src(['dist/prod/*.html'])
        .pipe(size())
        .pipe(zip('final.zip'))
        .pipe(advzip({ optimizationLevel: 4, iterations: 1000 }))
        .pipe(size({ title: 'zip' }))
        .pipe(gulp.dest('dist/zip'));
});

// -----------------------------------------------------------------------------
// Build
// -----------------------------------------------------------------------------
task('build', series(
    parallel('build:css', 'build:js', 'build:assets'),
    'build:html',
    'build:zip'
));

// -----------------------------------------------------------------------------
// Watch
// -----------------------------------------------------------------------------
task('watch', () => {
    gulp.watch('src/**', series('build'));
});

// -----------------------------------------------------------------------------
// Default
// -----------------------------------------------------------------------------
task('default', series('build', 'watch'));
