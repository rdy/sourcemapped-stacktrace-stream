const del = require('del');
const gulp = require('gulp');
const mergeStream = require('merge-stream');
const {babel, plumber} = require('gulp-load-plugins')();
const runSequence = require('run-sequence');
const webpackStream = require('webpack-stream');

gulp.task('clean', () => del('dist'));

gulp.task('build', done => runSequence('clean', 'babel', done));

gulp.task('babel', () => {
  return mergeStream(
    gulp.src(['src/**/*.js'], {base: 'src'}).pipe(plumber()).pipe(babel()),
    gulp.src(['src/index.js'], {base: 'src'}).pipe(plumber()).pipe(webpackStream(require('../config/webpack.config')('production'))),
    gulp.src(['LICENSE', 'README.md', 'package.json'])
  ).pipe(gulp.dest('dist'));
});

gulp.task('build', done => runSequence('clean', 'babel', done));

gulp.task('watch', ['build'], () => {
  gulp.watch('src/**/*.js', ['babel']);
});