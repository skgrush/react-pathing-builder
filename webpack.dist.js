/**
 * Inherits from `webpack.dev.js`, but doesn't use the devServer
 * and outputs a bundle.
 */

const merge = require('webpack-merge')
const path = require('path')

const dev = require('./webpack.dev.js')

module.exports = merge(dev, {
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'examples/dist'),
  },
})
