const NoErrorsPlugin = require('webpack/lib/NoErrorsPlugin');

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: null,
  output: {filename: 'spec.js'},
  plugins: [new NoErrorsPlugin()],
  quiet: true,
  watch: true
};