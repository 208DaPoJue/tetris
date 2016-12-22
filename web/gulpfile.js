var gulp = require("gulp");
var webpack = require('webpack-stream');
var webpackConfig = require("./webpack.config.js");

var root = '../dist';
var tetris = root + '/tetris';
var staticResource = tetris + '/static';

gulp.task("default", function () {
    
    gulp.src('./html/**')
        .pipe(gulp.dest(tetris));
    gulp.src('./assets/**')
        .pipe(gulp.dest(staticResource + '/assets'));
    gulp.src('./node_modules/phaser/build/phaser.min.js')
        .pipe(gulp.dest(staticResource));
    gulp.src('./typescript/html/index.tsx')
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(staticResource));
});