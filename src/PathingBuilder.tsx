import * as React from 'react'

import {Pointed, StateButtonBoxProps, PropertiesPanelProps} from './interfaces'
import {StateButtonBox, PropertiesPanel} from './components'
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
  propertiesPanelComponent?: React.ComponentClass<PropertiesPanelProps>
}

interface LoadedState {
  store: CanvasStore
  mapImg: HTMLImageElement
  width: number
  height: number
  className: string
  canvasClassName: string
  stateButtonBox: React.ComponentClass<StateButtonBoxProps>
  propertiesPanel: React.ComponentClass<PropertiesPanelProps>
}
interface NotLoadedState {
  store: null
  mapImg: null
  width: null
  height: null
  className: string
  canvasClassName: string
  stateButtonBox: React.ComponentClass<StateButtonBoxProps>
  propertiesPanel: React.ComponentClass<PropertiesPanelProps>
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
      propertiesPanel: props.propertiesPanelComponent || PropertiesPanel,
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
    const {stateButtonBoxComponent, propertiesPanelComponent} = this.props
    if (
      prevProps.className !== this.props.className ||
      prevProps.stateButtonBoxComponent !== stateButtonBoxComponent ||
      prevProps.propertiesPanelComponent !== propertiesPanelComponent
    )
      this.setState({
        stateButtonBox: stateButtonBoxComponent || StateButtonBox,
        propertiesPanel: propertiesPanelComponent || PropertiesPanel,
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

  private get passProps() {
    const {
      mapSrc,
      boundingWidth,
      boundingHeight,
      pixelOffset,
      children,
      className,
      stateButtonBoxComponent,
      propertiesPanelComponent,
      ...otherProps
    } = this.props

    return otherProps
  }

  static _updateClassNames(className: string = '') {
    const classNames = PathingBuilder._makeclassNames(className)
    const canvasClassName = PathingBuilder._makeCanvasClassNames(classNames)
    return {canvasClassName, className: className}
  }

  static _makeclassNames(className?: string) {
    if (!className) return ['pathing-builder']
    return ['pathing-builder'].concat(className.split(' '))
  }

  static _makeCanvasClassNames(classNames: string[]) {
    return classNames.map(c => `${c}-canvas`).join(' ')
  }

  private initCanvas = (canvas: HTMLCanvasElement) => {
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

  public readonly updateReact = (callback?: () => void) => {
    console.info('updateReact')
    this.forceUpdate(callback)
  }

  /**
   * Process for updating state with a new mapImg (or null)
   */
  private updateWithNewMap = (mapImg: HTMLImageElement | null) => {
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
        {this.state.store && (
          <this.state.propertiesPanel
            selected={this.state.store.selection}
            modifyLocation={this.state.store.modLoc}
            modifyEdge={this.state.store.modEdge}
            deleteLocation={this.state.store.removeLoc}
            deleteEdge={this.state.store.removeEdge}
          />
        )}

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
