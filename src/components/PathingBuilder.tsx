import * as React from 'react'

//import '../styles.css'

import {
  Pointed,
  StateButtonBoxProps,
  PropertiesPanelProps,
  DataImporterProps,
  ChangesExporterProps,
  DataExporterProps,
  ModularComponentProp,
  StyleSetterProps,
} from '../interfaces'
import {
  StateButtonBox,
  PropertiesPanel,
  ChangesExporter,
  DataExporter,
  DataImporter,
  PBCanvas,
  StyleSetter,
} from './'
import CanvasStore from '../state/CanvasStore'
import {loadMapSrc, fitBoxInBox, ClassNames} from '../utils'

interface ModularProps {
  stateButtonBoxComponent?: React.ComponentClass<StateButtonBoxProps> | null
  propertiesPanelComponent?: React.ComponentClass<PropertiesPanelProps> | null
  dataImporterComponent?: React.ComponentClass<DataImporterProps> | null
  changesExporterComponent?: React.ComponentClass<ChangesExporterProps> | null
  dataExporterComponent?: React.ComponentClass<DataExporterProps> | null
  styleSetterComponent?: React.ComponentClass<StyleSetterProps> | null
}

export interface Props extends ModularProps {
  mapSrc: HTMLImageElement | string | null
  boundingWidth?: number
  boundingHeight?: number
  pixelOffset?: Pointed
  className?: string
}

interface BaseState {
  className: string
  scaleRatio: number
}

interface LoadedState extends BaseState {
  store: CanvasStore
  mapImg: HTMLImageElement
  width: number
  height: number
}
interface NotLoadedState extends BaseState {
  store: null
  mapImg: null
  width: null
  height: null
}

type State = LoadedState | NotLoadedState

class PathingBuilder extends React.Component<Props, State> {
  readonly defaultClassName = 'pathing-builder'
  canvas: React.RefObject<HTMLCanvasElement>

  get StateButtonBox() {
    return this.getter('stateButtonBoxComponent', StateButtonBox)
  }
  get PropertiesPanel() {
    return this.getter('propertiesPanelComponent', PropertiesPanel)
  }
  get ChangesExporter() {
    return this.getter('changesExporterComponent', ChangesExporter)
  }
  get DataImporter() {
    return this.getter('dataImporterComponent', DataImporter)
  }
  get DataExporter() {
    return this.getter('dataExporterComponent', DataExporter)
  }

  get StyleSetter() {
    return this.getter('styleSetterComponent', StyleSetter)
  }

  get passProps() {
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

  constructor(props: Props) {
    super(props)

    const {className} = ClassNames.updateComponent(this)
    this.state = {
      store: null,
      mapImg: null,
      width: null,
      height: null,
      className,
      scaleRatio: 1,
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
      this.setState(ClassNames.updateComponent(this))

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

  public readonly updateReact = (callback?: () => void) => {
    console.info('updateReact')
    this.forceUpdate(callback)
  }

  private initCanvas = (canvas: HTMLCanvasElement) => {
    let store = this.state.store
    if (!store) {
      store = new CanvasStore({
        canvas,
        pixelOffset: this.props.pixelOffset,
        img: this.state.mapImg,
        updateReact: this.updateReact,
        scaleRatio: this.state.scaleRatio,
      })
      this.setState({store})
    } else {
      store.updateParams({
        img: this.state.mapImg,
        scaleRatio: this.state.scaleRatio,
      })
    }
  }

  /**
   * Process for updating state with a new mapImg (or null)
   */
  private updateWithNewMap = (mapImg: HTMLImageElement | null) => {
    console.debug('updateWithNewMap:', mapImg, this.props)
    if (mapImg) {
      if (this.props.boundingWidth || this.props.boundingHeight) {
        let {width, height, scaleRatio} = fitBoxInBox(mapImg, {
          width: this.props.boundingWidth,
          height: this.props.boundingHeight,
        })
        console.info('scaleRatio', scaleRatio)
        if (scaleRatio > 1) {
          scaleRatio = 1
          ;[width, height] = [mapImg.width, mapImg.height]
        }
        this.setState({mapImg, width, height, scaleRatio})
      } else {
        this.setState({
          mapImg,
          width: mapImg.width,
          height: mapImg.height,
          scaleRatio: 1,
        })
      }
    } else {
      this.setState({mapImg: null, width: null, height: null, scaleRatio: 1})
    }
  }

  /**
   * Helper for properties that retrieve ComponentClasses from this.props.
   * If the prop is null, return null (disable Component).
   * If the prop is undefined, return the default ComponentClass.
   *
   * @param {string} propName - React prop associated with a ComponentClass.
   * @param {ComponentClass} default_ - default ComponentClass.
   */
  private getter = <
    K extends keyof ModularProps,
    P extends ModularComponentProp,
    C extends React.ComponentClass<P>
    //Exclude<ModularProps[K], null | undefined>
  >(
    propName: K,
    default_: React.ComponentClass<P>
  ): C | React.ComponentClass<P> | null => {
    const propValue = this.props[propName]
    if (propValue === undefined) {
      return default_
    }
    if (!this.state.store || propValue === null) {
      return null
    }
    if (propValue && typeof propValue === 'function') {
      return (propValue as unknown) as React.ComponentClass<P>
    }
    console.error('prop:', propName, 'propValue:', propValue)
    throw new Error('Bad PathingBuilder getter arguments')
  }

  render() {
    const {mapImg, className, store} = this.state
    const {passProps} = this

    if (!mapImg) {
      return (
        <div {...passProps} className={className}>
          <span className="pb-message">Unable to load source image</span>
        </div>
      )
    }

    return (
      <div {...this.passProps} className={className}>
        {store && this.StateButtonBox && (
          <this.StateButtonBox
            onClickUndo={store.changelog.undo}
            onClickRedo={store.changelog.redo}
            onClickClear={() => store.clear()}
            undoCount={store.changelog.undoSize}
            redoCount={store.changelog.redoSize}
            isEmpty={store.isEmpty}
          />
        )}
        {store && this.PropertiesPanel && (
          <this.PropertiesPanel
            selected={store.selection}
            modifyLocation={store.modLoc}
            modifyEdge={store.modEdge}
            deleteLocation={store.removeLoc}
            deleteEdge={store.removeEdge}
          />
        )}

        <PBCanvas
          canvasRef={this.canvas}
          baseClassName={this.state.className}
          width={this.state.width || undefined}
          height={this.state.height || undefined}
        />

        {store && this.DataImporter && (
          <this.DataImporter
            lastChange={store.changelog.lastChange}
            importData={store.loadData}
          />
        )}
        {store && this.ChangesExporter && (
          <this.ChangesExporter
            lastChange={store.changelog.lastChange}
            exportData={store.changelog.exportChanges}
          />
        )}
        {store && this.DataExporter && (
          <this.DataExporter
            lastChange={store.changelog.lastChange}
            exportData={store.exportData}
          />
        )}

        {store && this.StyleSetter && (
          <this.StyleSetter
            lastChange={store.changelog.lastChange}
            styleUpdater={store.updateParams}
          />
        )}
      </div>
    )
  }
}

export {PathingBuilder}
