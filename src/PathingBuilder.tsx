import * as React from 'react'

import {Pointed} from './interfaces'
import CanvasStore from './state/CanvasStore'
import {loadMapSrc, fitBoxInBox} from './utils'

import './styles.css'

interface Props {
  mapSrc: HTMLImageElement | string | null
  boundingWidth?: number
  boundingHeight?: number
  pixelOffset?: Pointed
  className?: string
}

interface LoadedState {
  store: CanvasStore
  mapImg: HTMLImageElement
  width: number
  height: number
  className: string
  canvasClassName: string
}
interface NotLoadedState {
  store: null
  mapImg: null
  width: null
  height: null
  className: string
  canvasClassName: string
}

type State = LoadedState | NotLoadedState

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
    if (prevProps.className !== this.props.className)
      this.setState(PathingBuilder._updateClassNames(this.props.className))

    if (prevProps.mapSrc !== this.props.mapSrc) {
      if (this.props.mapSrc)
        loadMapSrc(this.props.mapSrc).then(this.updateWithNewMap)
      else this.updateWithNewMap(null)
    }

    console.debug('didUpdate:', this.state.mapImg && this.state.mapImg.src)

    const canvas = this.canvas.current
    if (
      canvas &&
      (!this.state.store || this.state.mapImg !== this.state.store.img)
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
      })
      this.setState({store})
    } else {
      store.updateParams({img: this.state.mapImg})
    }
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
