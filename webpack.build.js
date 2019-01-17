const merge = require('webpack-merge')
const path = require('path')

const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'react-pathing-builder.js',
    library: '',
    libraryTarget: 'commonjs',
  },
})
