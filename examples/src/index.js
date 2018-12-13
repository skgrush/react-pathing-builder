import * as React from 'react'
import * as ReactDOM from 'react-dom'

import PathingBuilder from '../../src'

const App = () => <PathingBuilder />

console.info('examples/src/index.js')
ReactDOM.render(<App />, document.getElementById('demo'))
