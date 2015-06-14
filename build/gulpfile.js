var program = require('commander');
var gulp = require('gulp');
var debug= require('gulp-debug');
var gulpif = require('gulp-if');
var print = require('gulp-print');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var clean = require('del');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var compileSass = require('gulp-ruby-sass');
var sass = require('gulp-sass');
var runSequence = require('run-sequence'); // Temporary solution until Gulp is updated to allow serial tasks
var minifyCss = require('gulp-minify-css');
var react = require('gulp-react');
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var os = require('os');
var http = require('http');
var shell = require('gulp-shell');

// Import constants.
var C = require('./settings/build/base');

// Import task functions.
var browserify = require('./scripts/build-browserify');
var source = require('./scripts/source-paths.js');

var isWatching = false;

program
    .version('0.1.0')
    .option('-r, --release', 'release build')
    .parse(process.argv);


//console.log('program'+ JSON.stringify(program, null, 2))

global.OUTPUT_TARGET_DIR = C.OUTPUT_DIR + (program.release ? C.TARGET_RELEASE : C.TARGET_DEBUG) + '/';

/**
 * Clean (clean)
 * - Force remove the build output directory, e.g. ../dist/
 */
gulp.task('clean', function(cb) {
    clean([global.OUTPUT_TARGET_DIR], { force: true }, cb);
});

/**
 * Markup
 */
gulp.task('build:markup', function() {
    // Copy index file to the build output directory
    return gulp.src(source.markup.index)
        .pipe(gulp.dest(global.OUTPUT_TARGET_DIR));
});

//    console.log('global.OUTPUT_TARGET_DIR'+global.OUTPUT_TARGET_DIR);

    //console.log(gulp.src(source.styles.index).pipe(gulp.dest(global.OUTPUT_TARGET_DIR)))

/**
 * Styles : TODO: not working
 */

gulp.task('build:styles', function() {
    return gulp.src(source.styles.index)
        .pipe(sass())
        //.pipe(debug({title:'sass'}))
        // save to ./dist folder
        .pipe(debug({title:global.OUTPUT_TARGET_DIR}))
        //.pipe(print())
        .pipe(gulpif(program.release, minifyCss()))
        .pipe(gulp.dest(global.OUTPUT_TARGET_DIR))
});


/**
 * Scripts
 */
gulp.task('build:scripts', function(cb) {
    var tasks = [
        'build:scripts:browserify'
    ];
    runSequence.apply(undefined, tasks.concat(cb));
});

/**
 * Runs Browserify on the JavaScript and JSX files. Also executes Madge to check for circular dependencies.
 */
gulp.task('build:scripts:browserify', browserify);

/**
 * Linter
 * - Runs JSHint on relevant depedencies, e.g. files in ../dist/src
 * - Note that ../.jshintrc is used
 */
gulp.task('lint:scripts', function() {
    var jsxGlob,
        jsGlob,
        includes,
        excludes,
        tempDir;

    //jsxGlob = C.SRC_DIR + 'js/**/*.jsx';

    includes = [
        C.SRC_DIR + 'js/**/*.js',
        C.SRC_DIR + 'js/*.js'
    ];

    excludes = [
        // node modules
        C.SRC_DIR + '**/node_modules/**/*',
        // 3rd party library
        C.SRC_DIR + 'lib/**/*',
        C.SRC_DIR + 'lib/*',
    ];

    tempDir = 'jshint-temp';

    clean.sync(tempDir);

    jsGlob = includes.concat(excludes.map(function (e) {
        return '!' + e;
    }));

    return gulp.src(jsGlob)
        // Runs jshint on js files in /core and /ui directories
        .pipe(jshint('../.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(gulp.dest(tempDir + '/js'))
        .pipe(jshint('../.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});

/**
 * Watch Sources
 * - Watch PROPERTIES files and recompile when changed
 * - Watch SCSS files and recompile when changed
 * - Watch JSX, JS files and recompile when changed (excluding libraries)
 */
gulp.task('watch', function() {
    isWatching = true;

    var tasks = {
        scripts   : ['build:scripts', 'lint:scripts'],
        styles    : ['build:styles']
    };

    gulp.watch(source.styles.includes, function () {
        runSequence.apply(undefined, tasks.styles);
    });

    gulp.watch(source.scripts.includes.concat(
        // Prefix paths in excludes with bang
        source.scripts.excludes.map(function(path) {
            return '!' + path;
        })), function() {
        runSequence.apply(undefined, tasks.scripts);
    });
});

/**
 * Builds the UI for debugging purposes. Executed when no task is specified in the CLI:
 * - Clean build output directory
 * - Build markup, styles, and scripts
 * - Lint scripts
 */
gulp.task('default', function() {
    runSequence('clean',
        ['build:markup', 'build:styles', 'build:scripts']);
});


gulp.task('help', program.help.bind(program));

/**
 *  Builds the UI for debugging purposes. Task will also automatically rebuild when the source code changes:
 * - Clean build output directory
 * - Build markup, styles, and scripts
 * - Lint scripts
 */
gulp.task('start', function() {
    runSequence('default', 'watch');
});