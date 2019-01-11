import * as React from 'react'
import * as ReactDOM from 'react-dom'

import PathingBuilder from '../../src'
import {ErrorBox} from './ErrorBox'

import './index.css'

interface State {
  imgSrc: string | null
}

const DEFAULT =
  'https://upload.wikimedia.org/wikipedia/commons/1/17/BlankMap-World-noborders.png'

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
    console.log(this.state)
    return (
      <main>
        <input ref="upload" type="file" onChange={this.onChange} />
        <input
          type="button"
          onClick={() => this.setState({imgSrc: DEFAULT})}
          value="Default Img"
        />
        {this.state.imgSrc && (
          <PathingBuilder
            className="funybuilder"
            mapSrc={this.state.imgSrc}
            pixelOffset={{x: 20, y: 50}}
          />
        )}
        <ErrorBox />
      </main>
    )
  }
}

console.info('examples/src/index.ts')
ReactDOM.render(<App />, document.getElementById('demo'))
