module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'extension.js',
    path: require('path').resolve(__dirname, 'dist'),
    library: 'argocdAppLinksExtension',
    libraryTarget: 'window'
  },
  externals: {
    react: 'React'
  },
  mode: 'production'
};
