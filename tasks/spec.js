const gulp = require('gulp');
const {plumber, jasmineBrowser} = require('gulp-load-plugins')();
const webpack = require('webpack-stream');

const specs = () => gulp.src('spec/**/*_spec.js', {base: '.'}).pipe(plumber());

function testAssets(options = {}) {
  const webpackConfig = {...require('../config/webpack.config')('test'), ... options};
  return specs().pipe(webpack(webpackConfig));
}

gulp.task('spec', function() {
  return testAssets({watch: false})
    .pipe(jasmineBrowser.specRunner({console: true}))
    .pipe(jasmineBrowser.phantomjs());
});

gulp.task('jasmine', function() {
  return testAssets()
    .pipe(jasmineBrowser.specRunner({sourcemappedStacktrace: true}))
    .pipe(jasmineBrowser.server());
});