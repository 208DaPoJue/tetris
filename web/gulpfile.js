var gulp = require("gulp");
var webpack = require('webpack-stream');
var webpackConfig = require("./webpack.config.js");

var dest = '../dist'
var destWeb = dest + '/web';

gulp.task("default", function () {
    gulp.src('./server.py')
        .pipe(gulp.dest(dest));
    gulp.src('./node_modules/phaser/build/phaser.min.js')
        .pipe(gulp.dest(destWeb));
    gulp.src('./html/**')
        .pipe(gulp.dest(destWeb));
    gulp.src('./assets/**')
        .pipe(gulp.dest(destWeb + '/assets'));
    gulp.src('./typescript/src/index.ts')
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(destWeb));
});