const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');

module.exports = {
  plugins: [
    new UglifyJsPlugin({compress: {warnings: false}, sourceMap: false})
  ]
};