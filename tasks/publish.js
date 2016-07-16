const gulp = require('gulp');
const npm = require('npm');
const thenify = require('thenify');

const load = thenify(npm.load);

gulp.task('publish', ['build'], async () => {
  await load();
  await (thenify(npm.commands.publish))(['dist']);
});