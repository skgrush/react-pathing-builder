const merge = require('webpack-merge')
const path = require('path')

const common = require('./webpack.common.js')

const HtmlWebpackPlugin = new (require('html-webpack-plugin'))({
  template: path.join(__dirname, 'examples/src/index.html'),
  filename: './index.html',
})

module.exports = merge(common, {
  mode: 'development',
  entry: path.join(__dirname, 'examples/src/index.tsx'),
  plugins: [HtmlWebpackPlugin],
  devServer: {
    port: 3001,
  },
})
