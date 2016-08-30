module.exports = {
  bail: false,
  entry: {
    'browser': './src/index.js'
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel?sourceMaps=true'},
      {test: /\.json$/, loader: 'json'}
    ]
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[id].js',
    libraryTarget: 'umd',
    library: 'SourcemappedStacktraceStream',
    umdNamedDefine: true,
  }
};