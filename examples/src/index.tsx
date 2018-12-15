import * as React from 'react'
import * as ReactDOM from 'react-dom'

import PathingBuilder from '../../src'

interface State {
  imgSrc: string | null
}

class App extends React.Component<any, State> {
  state: State = {imgSrc: null}

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.debug('onChange file uploaded:', [e])
    if (e.currentTarget && e.currentTarget.value) {
      const curFiles = e.currentTarget.files
      if (curFiles && curFiles.length) {
        this.setState({imgSrc: URL.createObjectURL(curFiles[0])})
      } else {
        this.setState({imgSrc: null})
      }
    }
  }

  render() {
    return (
      <main>
        <input ref="upload" type="file" onChange={this.onChange} />
        {this.state.imgSrc && (
          <PathingBuilder className="funybuilder" mapSrc={this.state.imgSrc} />
        )}
      </main>
    )
  }
}

console.info('examples/src/index.ts')
ReactDOM.render(<App />, document.getElementById('demo'))
