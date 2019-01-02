import * as React from 'react'

import {Pointed, StateButtonBoxProps, PropertiesPanelProps} from './interfaces'
import {StateButtonBox, PropertiesPanel, ChangesExporter} from './components'
import CanvasStore from './state/CanvasStore'
import {loadMapSrc, fitBoxInBox} from './utils'

import './styles.css'
import DataImporter from './components/DataImporter'

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

const FakeChangelog = Object.freeze({
  undo: () => false,
  redo: () => false,
  undoSize: 0,
  redoSize: 0,
})

class PathingBuilder extends React.Component<Props, State> {
  canvas: React.RefObject<HTMLCanvasElement>

  get StateButtonBox() {
    return this.props.stateButtonBoxComponent || StateButtonBox
  }

  get PropertiesPanel() {
    return this.props.propertiesPanelComponent || PropertiesPanel
  }

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
      this.setState({
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

  get ChangesExporter() {
    return ChangesExporter
  }

  get DataImporter() {
    return DataImporter
  }

  render() {
    const {mapImg, className, store} = this.state

    if (!mapImg) {
      return (
        <div {...this.passProps} className={className}>
          <span className="pb-message">Unable to load source image</span>
        </div>
      )
    }

    // if (!store) {
    //   return (
    //     <div {...this.passProps} className={className}>
    //       <span className="pb-message">CanvasStore not loaded</span>
    //     </div>
    //   )
    // }

    return (
      <div {...this.passProps} className={className}>
        {store && (
          <this.StateButtonBox
            onClickUndo={store.changelog.undo}
            onClickRedo={store.changelog.redo}
            undoCount={store.changelog.undoSize}
            redoCount={store.changelog.redoSize}
          />
        )}
        {store && (
          <this.PropertiesPanel
            selected={store.selection}
            modifyLocation={store.modLoc}
            modifyEdge={store.modEdge}
            deleteLocation={store.removeLoc}
            deleteEdge={store.removeEdge}
          />
        )}

        <canvas
          ref={this.canvas}
          className={this.state.canvasClassName}
          width={mapImg.width || undefined}
          height={mapImg.height || undefined}
        />
        {store && (
          <this.ChangesExporter
            lastChange={store.changelog.lastChange}
            exportData={store.changelog.exportChanges}
          />
        )}
        {store && (
          <this.DataImporter
            lastChange={store.changelog.lastChange}
            importData={store.loadData}
          />
        )}
      </div>
    )
  }
}

export default PathingBuilder
