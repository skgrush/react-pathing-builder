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
        <section className="pre-sect">
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
        </section>
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
        <section className="post-sect">
          <h4>Controls:</h4>
          <p>Double-click to add a new Location.</p>
          <p>
            While selecting a Location, <kbd>Shift</kbd>+click another Location
            to create an Edge or <kbd>Shift</kbd>+click empty space to create an
            Edge to a new Location.
          </p>
          <p>
            <kbd>Backspace</kbd>/<kbd>Delete</kbd> will delete the selected
            Location or Edge.
          </p>
          <p>
            <kbd>&#8984;</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Z</kbd>{' '}
            performs Undo, and adding <kbd>Shift</kbd> performs Redo.
          </p>
          <p>Locations can be moved three ways:</p>
          <ul>
            <li>using the Location Panel</li>
            <li>by clicking-and-dragging</li>
            <li>using the arrow keys</li>
          </ul>
          <p>
            Arrow keys with no modifiers moves by 5px, <kbd>Opt</kbd>/
            <kbd>Ctrl</kbd> moves by 1px (fine), <kbd>Shift</kbd> moves by 50px
            (coarse).
          </p>
        </section>
      </main>
    )
  }
}

console.info('examples/src/index.ts')
ReactDOM.render(<App />, document.getElementById('demo'))
