module.exports = {
  bail: false,
  entry: {
    'sourcemapped-stacktrace-stream': './src/index.js'
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel?sourceMaps=true'}
    ]
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[id].js'
  }
};