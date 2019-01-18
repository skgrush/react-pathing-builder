import * as React from 'react'
import * as ReactDOM from 'react-dom'

import PathingBuilder from '../../src'

import '../../src/styles.css'
import './index.css'

interface State {
  imgSrc: string | null
}

const DEFAULT =
  'https://upload.wikimedia.org/wikipedia/commons/1/17/BlankMap-World-noborders.png'

class App extends React.Component<any, State> {
  state: State = {imgSrc: null}

  onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.debug('onUpload file uploaded:', [e])
    if (e.currentTarget && e.currentTarget.value) {
      const curFiles = e.currentTarget.files
      if (curFiles && curFiles.length) {
        this.setState({imgSrc: URL.createObjectURL(curFiles[0])})
      } else {
        this.setState({imgSrc: null})
      }
    }
  }

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget) {
      e.persist()
      console.debug('onKeyDown[Enter]:', e)
      let {value} = e.currentTarget
      if (!value) {
        value = null
      } else if (value.indexOf('://') === -1) {
        value = `http://${value}`
        e.currentTarget.value = value
      }
      this.setState({imgSrc: value})
    }
  }

  render() {
    console.log(this.state)
    return (
      <main>
        <div>
          <h2>
            Demo of <code>react-pathing-builder</code> PathingBuilder Component
          </h2>
          <p>
            The component requires the prop <code>mapSrc</code>, which can be an
            image URL, an <code>HTMLImageElement</code>
            object, or <code>null</code>.
          </p>
          <p>
            In the following example, you can set the <code>mapSrc</code>
            prop with a uploaded image, an entered URL, or with a default image
            URL.
          </p>
        </div>
        <label htmlFor="upload">Upload:</label>
        <input name="upload" type="file" onChange={this.onUpload} />
        <label htmlFor="url">URL:</label>
        <input
          type="url"
          name="url"
          placeholder="https://example.com"
          pattern="https://.*"
          onKeyDown={this.onKeyDown}
        />
        <label htmlFor="default">Default:</label>
        <input
          type="button"
          name="default"
          onClick={() => this.setState({imgSrc: DEFAULT})}
          value="Default Img"
          title={DEFAULT}
        />
        {this.state.imgSrc && (
          <PathingBuilder
            className="funybuilder"
            mapSrc={this.state.imgSrc}
            boundingWidth={900}
            boundingHeight={700}
            pixelOffset={{x: 20, y: 50}}
          />
        )}
      </main>
    )
  }
}

console.info('examples/src/index.ts')
ReactDOM.render(<App />, document.getElementById('demo'))
