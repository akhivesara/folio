var browserify = require('browserify');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var streamify = require('gulp-streamify');
var madge = require('madge');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var es = require('event-stream');
var program = require('commander');
var AppSource = require('./source-paths.js');
var C = require('../settings/build/base');
var collapser = require('bundle-collapser/plugin');

module.exports = function(done) {
    var dependencies,
        circular,
        vendors,
        app;

    dependencies = madge([C.SRC_DIR + 'js' , C.SRC_DIR + 'lib'], {
        exclude: 'node_modules'
    });

    circular = dependencies.circular().getArray();

    if (circular.length) {
        throw ('Circular dependencies need resolving: ' + circular);
        done();
    }

    // Note that in order to generate a release build, third-party libraries that have already been minified
    // must be excluded from the main application bundle and bundled separately
    if (program.release) {
        // Create a third-party libraries bundle
        vendors = browserify()
            // Currently only contains the React library (use minified version)
            //.require(C.SRC_DIR + 'lib/react/react-with-addons.min.js', { expose: 'react'})
            .require([  { file: C.SRC_DIR + 'lib/amplify.js', expose: 'amplify'} ,
                        { file:C.SRC_DIR + 'lib/date.js', expose: 'date'} ,
                        { file:C.SRC_DIR + 'lib/highcharts.js', expose: 'highcharts'} ,
                        { file:C.SRC_DIR + 'lib/jQuery.js', expose: 'jQuery'},
                        { file:C.SRC_DIR + 'lib/jquery.handsontable.full.js', expose: 'handsontable'}
            ])
            .bundle()
            .pipe(source('vendors.js'));
        // Create main application bundle
        app = browserify(AppSource.scripts.index, { debug: false })
            // Do not include React library in this bundle
            //.external('react')
            //.transform('reactify')
            .plugin(collapser)
            .bundle()
            .on('error', done)
            .pipe(source('app.js'))
            /**
             * preserveComments can be 'all', 'some', or 'function'
             * @see https://www.npmjs.org/package/gulp-uglify
             */
            .pipe(streamify(uglify({ preserveComments: 'some' })));
        // Combine vendors and app vinyl file streams
        return es.concat(vendors, app)
            .pipe(buffer()) // Convert from stream to buffer
            .pipe(concat(C.OUTPUT_SCRIPT_FILENAME)) // gulp-concat only works with buffers
            .pipe(gulp.dest(global.OUTPUT_TARGET_DIR));

    // Debug builds can include non-minified third-party libraries
    } else {
        return browserify(AppSource.scripts.index, { debug: true })
            .require([  { file: C.SRC_DIR + 'lib/amplify.js', expose: 'amplify'} ,
                { file:C.SRC_DIR + 'lib/date.js', expose: 'date'} ,
                { file:C.SRC_DIR + 'lib/highcharts.src.js', expose: 'highcharts'} ,
                { file:C.SRC_DIR + 'lib/jquery.handsontable.full.js', expose: 'handsontable'},
                { file:C.SRC_DIR + 'lib/jQuery.js', expose: 'jQuery'}
            ])
            // Include source maps
            .bundle()
            .on('error', done)
            .pipe(source(C.OUTPUT_SCRIPT_FILENAME))
            .pipe(gulp.dest(global.OUTPUT_TARGET_DIR));
    }
};
