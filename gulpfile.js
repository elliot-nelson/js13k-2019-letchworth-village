// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------
const advpng            = require('imagemin-advpng');
const childProcess      = require('child_process');
const fs                = require('fs');
const gulp              = require('gulp');
const rollup            = require('rollup');
const rollupTypescript  = require('rollup-plugin-typescript2');

// -----------------------------------------------------------------------------
// Gulp Plugins
// -----------------------------------------------------------------------------
const advzip            = require('gulp-advzip');
const concat            = require('gulp-concat');
const cleancss          = require('gulp-clean-css');
const htmlmin           = require('gulp-htmlmin');
const imagemin          = require('gulp-imagemin');
const size              = require('gulp-size');
const sourcemaps        = require('gulp-sourcemaps');
const template          = require('gulp-template');
const terser            = require('gulp-terser');
const zip               = require('gulp-zip');

// -----------------------------------------------------------------------------
// Flags
// -----------------------------------------------------------------------------
let watching = false;

// -----------------------------------------------------------------------------
// JS Build
// -----------------------------------------------------------------------------
async function compileBuild() {
    const bundle = await rollup.rollup({
        input: 'src/ts/index.ts',
        plugins: [
            rollupTypescript()
        ],
        onwarn: (warning, rollupWarn) => {
            // Suppress circular dependency spam.
            if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                rollupWarn(warning);
            }
        }
    });

    await bundle.write({
        file: 'dist/temp/app.js',
        format: 'iife',
        name: 'app',
        sourcemap: true
    });
}

async function minifyBuild() {
    return gulp.src('dist/temp/app.js')
        .pipe(sourcemaps.init())
        .pipe(terser({
            mangle: {
                properties: true,
                reserved: ['tomato']
            }
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/temp'));
}

const buildJs = gulp.series(compileBuild, minifyBuild);

// -----------------------------------------------------------------------------
// CSS Build
// -----------------------------------------------------------------------------
function buildCss() {
    return gulp.src('src/css/*.css')
        .pipe(concat('app.css'))
        .pipe(cleancss())
        .pipe(gulp.dest('dist/temp'));
}

// -----------------------------------------------------------------------------
// Assets Build
// -----------------------------------------------------------------------------
function buildAssets() {
    return gulp.src('src/assets/*.png')
        .pipe(imagemin())
        .pipe(imagemin([
            advpng({ optimizationLevel: 4, iterations: 50 })
        ]))
        .pipe(gulp.dest('dist/build'));
}

// -----------------------------------------------------------------------------
// HTML Build
// -----------------------------------------------------------------------------
function buildHtml() {
    const cssContent = fs.readFileSync('dist/temp/app.css');
    const jsContent = fs.readFileSync('dist/temp/app.js');

    return gulp.src('src/index.html')
        .pipe(template({ css: cssContent, js: jsContent }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.src('dist/temp/app.js.map'))
        .pipe(gulp.dest('dist/build'));
}

// -----------------------------------------------------------------------------
// ZIP Build
// -----------------------------------------------------------------------------
function buildZip() {
    return gulp.src(['dist/build/*', '!dist/build/*.map'])
        .pipe(size())
        .pipe(zip('js13k-2019-letchworth-village.zip'))
        .pipe(advzip({ optimizationLevel: 4, iterations: 100 }))
        .pipe(size({ title: 'zip' }))
        .pipe(gulp.dest('dist/final'));
}

// -----------------------------------------------------------------------------
// Build
// -----------------------------------------------------------------------------
async function ready() {
    if (watching) {
        childProcess.exec('say OK');
    }
}

const build = gulp.series(
    gulp.parallel(buildCss, buildJs, buildAssets),
    buildHtml,
    ready,
    buildZip
);

// -----------------------------------------------------------------------------
// Watch
// -----------------------------------------------------------------------------
function watch() {
    watching = true;
    gulp.watch('src/**', build);
}

// -----------------------------------------------------------------------------
// Task List
// -----------------------------------------------------------------------------
module.exports = {
    compileBuild,
    minifyBuild,

    buildJs,
    buildCss,
    buildAssets,
    buildHtml,
    buildZip,
    build,
    watch,

    default: gulp.series(build, watch)
};
