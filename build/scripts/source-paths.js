var path = require('path');
var C = require('../settings/build/base');
var SRC_DIR = C.SRC_DIR;

module.exports = {
    markup: {
        index: SRC_DIR + 'index.html'
    },

    styles: {
        root: path.resolve(SRC_DIR + 'css/'),
        //index: [SRC_DIR + 'css/portfolio.css', SRC_DIR + 'lib/css/animate.css',  SRC_DIR + 'lib/css/jquery.handsontable.full.css'],
        index: SRC_DIR + 'index.css',
        includes: SRC_DIR + 'lib/css/*.css',
        //libs : [SRC_DIR + 'lib/css/animate.css',  SRC_DIR + 'lib/css/jquery.handsontable.full.css'],
        lib : SRC_DIR + 'lib/css/*.css',
        main : SRC_DIR + 'css/*.css',
        //mains  : SRC_DIR + 'css/portfolio.css'
    },
    scripts: {
        index: [SRC_DIR + 'js/index.js'],
        includes: [SRC_DIR + 'js/*.js',  SRC_DIR + 'js/**/*.js', SRC_DIR + 'lib/*.js'],
        excludes: []
    }
};

