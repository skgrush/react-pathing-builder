import * as React from 'react'

import {Pointed, StateButtonBoxProps} from './interfaces'
import {StateButtonBox} from './components'
import CanvasStore from './state/CanvasStore'
import {loadMapSrc, fitBoxInBox} from './utils'

import './styles.css'

interface Props {
  mapSrc: HTMLImageElement | string | null
  boundingWidth?: number
  boundingHeight?: number
  pixelOffset?: Pointed
  className?: string
  stateButtonBoxComponent?: React.ComponentClass<StateButtonBoxProps>
}

interface LoadedState {
  store: CanvasStore
  mapImg: HTMLImageElement
  width: number
  height: number
  className: string
  canvasClassName: string
  stateButtonBox: React.ComponentClass<StateButtonBoxProps>
}
interface NotLoadedState {
  store: null
  mapImg: null
  width: null
  height: null
  className: string
  canvasClassName: string
  stateButtonBox: React.ComponentClass<StateButtonBoxProps>
}

type State = LoadedState | NotLoadedState

const FakeChangelog = Object.freeze({
  undo: () => false,
  redo: () => false,
  undoSize: 0,
  redoSize: 0,
})

class PathingBuilder extends React.Component<Props, State> {
  canvas: React.RefObject<HTMLCanvasElement>

  constructor(props: Props) {
    super(props)

    const classNames = PathingBuilder._makeclassNames(this.props.className)
    this.state = {
      store: null,
      mapImg: null,
      width: null,
      height: null,
      className: classNames.join(' '),
      canvasClassName: PathingBuilder._makeCanvasClassNames(classNames),
      stateButtonBox: props.stateButtonBoxComponent || StateButtonBox,
    }
    this.canvas = React.createRef()
  }

  componentWillMount() {
    if (this.props.mapSrc)
      loadMapSrc(this.props.mapSrc).then(this.updateWithNewMap)
  }

  componentDidMount() {
    if (this.canvas.current) {
      this.initCanvas(this.canvas.current)
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.className !== this.props.className ||
      this.props.stateButtonBoxComponent !== prevProps.stateButtonBoxComponent
    )
      this.setState({
        stateButtonBox: this.props.stateButtonBoxComponent || StateButtonBox,
        ...PathingBuilder._updateClassNames(this.props.className),
      })

    if (prevProps.mapSrc !== this.props.mapSrc) {
      if (this.props.mapSrc)
        loadMapSrc(this.props.mapSrc).then(this.updateWithNewMap)
      else this.updateWithNewMap(null)
    }

    const canvas = this.canvas.current
    if (
      canvas &&
      (!this.state.store || this.state.mapImg !== this.state.store.mapImg)
    ) {
      this.initCanvas(canvas)
    }
  }

  get passProps() {
    const {
      mapSrc,
      boundingWidth,
      boundingHeight,
      pixelOffset,
      children,
      className,
      ...otherProps
    } = this.props

    return otherProps
  }

  static _updateClassNames = (className: string = '') => {
    const classNames = PathingBuilder._makeclassNames(className)
    const canvasClassName = PathingBuilder._makeCanvasClassNames(classNames)
    return {canvasClassName, className: className}
  }

  static _makeclassNames = (className?: string) => {
    if (!className) return ['pathing-builder']
    return ['pathing-builder'].concat(className.split(' '))
  }

  static _makeCanvasClassNames = (classNames: string[]) => {
    return classNames.map(c => `${c}-canvas`).join(' ')
  }

  initCanvas = (canvas: HTMLCanvasElement) => {
    let store = this.state.store
    if (!store) {
      store = new CanvasStore({
        canvas,
        pixelOffset: this.props.pixelOffset,
        img: this.state.mapImg,
        updateReact: this.updateReact,
      })
      this.setState({store})
    } else {
      store.updateParams({img: this.state.mapImg})
    }
  }

  updateReact = (callback?: () => void) => {
    console.info('updateReact')
    this.forceUpdate(callback)
  }

  /**
   * Process for updating state with a new mapImg (or null)
   */
  updateWithNewMap = (mapImg: HTMLImageElement | null) => {
    console.debug('updateWithNewMap:', mapImg)
    if (mapImg) {
      if (this.props.boundingWidth && this.props.boundingHeight) {
        const {width, height} = fitBoxInBox(mapImg, {
          width: this.props.boundingWidth,
          height: this.props.boundingHeight,
        })
        this.setState({mapImg, width, height})
      } else {
        this.setState({mapImg, width: mapImg.width, height: mapImg.height})
      }
    } else {
      this.setState({mapImg: null, width: null, height: null})
    }
  }

  get changelog() {
    return (this.state.store && this.state.store.changelog) || FakeChangelog
  }

  render() {
    const {mapImg} = this.state
    if (!mapImg) {
      return (
        <div className="pathing-builder">
          <span className="pb-message">Unable to load source image</span>
        </div>
      )
    }

    return (
      <div {...this.passProps} className={this.state.className}>
        <this.state.stateButtonBox
          onClickUndo={this.changelog.undo}
          onClickRedo={this.changelog.redo}
          undoCount={this.changelog.undoSize}
          redoCount={this.changelog.redoSize}
        />
        <canvas
          ref={this.canvas}
          className={this.state.canvasClassName}
          width={mapImg.width || undefined}
          height={mapImg.height || undefined}
        />
      </div>
    )
  }
}

export default PathingBuilder
