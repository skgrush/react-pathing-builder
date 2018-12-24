import Location, {LocationLike, LocationMutableProps} from './Location'
import Edge, {getEdgeKey, EdgeMutable} from './Edge'
import {Star, Shape, ShapeMap, ShapeSubclass, ShapeParams} from '../drawables'
import {
  Pointed,
  CanvasStyleType,
  LocationStyler,
  LocationShaper,
  LabelStyler,
} from '../interfaces'
import {diffPointed, base64} from '../utils'
import {UniquenessError} from '../errors'
import ChangeStore from './changes/ChangeStore'

export type ClickModifier = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'
const CLICK_MODIFIERS = Object.freeze([
  'altKey',
  'ctrlKey',
  'metaKey',
  'shiftKey',
] as ClickModifier[])

const DEFAULT_RADIUS = 10

/**
 * The arguments and modifiable-properties of CanvasStore.
 * Can be passed to the constructor or updateParams().
 * See the associated properties on CanvasStore for descriptions.
 */
interface Parameters {
  img?: HTMLImageElement | null
  canvas?: HTMLCanvasElement
  refreshInterval?: number
  pixelOffset?: Pointed
  weightScale?: number
  addMod?: ClickModifier
  selectionStroke?: CanvasStyleType
  locStyleGetter?: LocationStyler
  locShapeGetter?: LocationShaper
}

interface ConstructorParameters extends Parameters {
  canvas: HTMLCanvasElement
  updateReact: (cb?: () => void) => void
}

export default class CanvasStore {
  /** the map image to base the coordinate system on */
  private img: HTMLImageElement | null = null
  /** the actual canvas to draw on */
  private canvas: HTMLCanvasElement
  /** milliseconds between redraw frame requests */
  private refreshInterval: number = Math.floor(1000 / 15)
  /** offset of the canvas, i.e. left/top padding + border */
  private pixelOffset: Pointed | null = null
  /** multiplier for determining stroke-width from weight for Edges */
  private weightScaleMult: number = 1
  /** mouse modifier for adding an Edge */
  private addMod: ClickModifier = 'shiftKey'
  /** highlight color/style of selected Locations or Edges */
  private selectionStroke: CanvasStyleType = '#F6B'
  /** Resolve label style from a Location */
  labelStyleGetter: LabelStyler = CanvasStore.defaultLabelStyler
  /** Resolve shape style from a Location */
  locStyleGetter: LocationStyler = CanvasStore.defaultLocStyler
  /** Resolve shape class from a Location */
  locShapeGetter: LocationShaper = CanvasStore.defaultLocShaper
  /** PathingBuilder method to call for forcing React to update */
  private updateReact: (cb?: () => void) => void

  /** @section {drawing state variables} */
  /** Canvas validity; `false` indicates a redraw is needed. */
  private valid: boolean = false
  /** Drag Offset between mouse and thing; indicates dragging is happening. */
  private dragoff: Pointed | null = null
  /** Name of selected Location or Edge, else null. */
  private _selectedName: string | null = null
  /** Selected Location | Edge | null. */
  private _selection: Location | Edge | null = null
  /** ID from setInterval in prepCanvas() */
  private intervalID: number | null = null
  /** Log of changes to the state; implements undo/redo */
  readonly changelog: ChangeStore

  /** map currently-added Location-names to Locations. */
  private readonly locationMap: Map<string, Location> = new Map()
  /** map currently-added Edge-keys to Edges. */
  private readonly edgeMap: Map<string, Edge> = new Map()

  get selectedName() {
    return this._selectedName
  }

  get selection() {
    return this._selection
  }

  get mapImg() {
    return this.img
  }

  get weightScale() {
    return this.weightScaleMult
  }

  get canvasDimensions(): Pointed {
    return this.img
      ? {
          x: this.img.width,
          y: this.img.height,
        }
      : {x: 0, y: 0}
  }

  constructor(params: ConstructorParameters) {
    ;(window as any).canvasStore = this
    this.changelog = new ChangeStore(this, params.updateReact)
    this.canvas = params.canvas
    this.updateReact = params.updateReact
    this.updateParams(params, true)
  }

  /**
   * Public interface for requesting redraw
   */
  redraw = () => {
    if (this.valid) this.valid = false
  }

  loadData = (data: any) => {
    // TODO
    throw 'loadData not implemented'
  }

  /**
   * Public parameter updater.
   *
   * @param {Parameters} params - new partial parameters
   * @param {boolean} [first=false] - if true, force prepping canvas
   */
  updateParams = (params: Parameters, first?: boolean) => {
    console.debug('updateParams', params)
    const {img, pixelOffset, canvas, refreshInterval, selectionStroke} = params

    if (img !== undefined) this.setImg(img)

    if (selectionStroke !== undefined) this.selectionStroke = selectionStroke

    if (params.hasOwnProperty('locStyleGetter'))
      this.locStyleGetter =
        params.locStyleGetter || CanvasStore.defaultLocStyler

    if (params.hasOwnProperty('locShapeGetter'))
      this.locShapeGetter =
        params.locShapeGetter || CanvasStore.defaultLocShaper

    if (pixelOffset) {
      const {x, y} = pixelOffset
      this.pixelOffset = Object.assign(this.pixelOffset || {}, {x, y})
    }

    if ((canvas && this.canvas !== canvas) || refreshInterval || first) {
      if (canvas) this.canvas = canvas
      if (refreshInterval) this.refreshInterval = refreshInterval
      this.prepCanvas()
    }

    for (const modProp of ['addMod']) {
      const modArg = (params as any)[modProp] as ClickModifier | undefined
      if (!modArg) continue
      else if (CLICK_MODIFIERS.indexOf(modArg) !== -1) {
        ;(this as any)[modProp] = modArg
      } else console.warn(`Parameter ${modProp} has non-modifier value`)
    }
  }

  updateShapes = () => {
    for (const loc of this.locationMap.values()) {
      loc.updateShape()
    }
    this.valid = false
  }

  updateStyles = () => {
    for (const loc of this.locationMap.values()) {
      loc.updateStyle()
    }
    this.valid = false
  }

  addLoc = (loc: Location) => {
    if (!loc.name) {
      throw new UniquenessError(`Failed to add location ""`)
    }
    if (loc.name.includes('\t')) {
      throw new Error("Location name contains illegal character '\\t'")
    }
    if (this.locationMap.has(loc.name))
      throw new UniquenessError(`Failed to add duplicate location ${loc.name}`)

    this.locationMap.set(loc.name, loc)
    this.changelog.newAdd(loc)
    this.valid = false
    return true
  }

  modLoc = (loc: Readonly<Location>, diff: LocationMutableProps) => {
    let ret = true
    const L = this.locationMap.get(loc.name)
    if (!L) {
      console.debug('modLoc called on unregistered Location')
      return false
    }

    if (diff.name) {
      L.name = diff.name
      this.changelog.newMutateLoc(L, 'name', L.name, diff.name)
    }
    if (diff.shape) {
      const oldShape = L.shape
      if (ShapeMap.hasOwnProperty(diff.shape)) {
        // TODO
        const shapeClass = ShapeMap[diff.shape]
        if (!shapeClass) {
          console.warn(`ShapeMap[${diff.shape}] -> ${shapeClass}`)
          ret = false
        } else {
          const newShape = L.updateShape(shapeClass)
          if (newShape)
            this.changelog.newMutateLoc(L, 'shape', oldShape, newShape)
          else {
            ret = false
          }
        }
      } else {
        console.debug('Unexpected shape to Location.update:', diff.shape)
        ret = false
      }
    }
    if (diff.x !== undefined || diff.y !== undefined) {
      const oldX = L.x,
        oldY = L.y
      let {x, y} = diff
      if (!x) x = oldX
      if (!y) y = oldY
      this.changelog.newGrab(L, L)
      L.moveTo({x, y})
      this.changelog.newDrop(L, {x, y})
    }
    this.valid = false
    return ret
  }

  removeLoc = (locName: string) => {
    const loc = this.locationMap.get(locName)
    if (!loc) return false

    for (const neighborName of loc.neighborNames) {
      const neighbor = this.locationMap.get(neighborName)
      if (!neighbor) {
        console.warn(`loc ${locName} has missing neighbor ${neighborName}`)
        continue
      }
      this.removeEdge(loc, neighbor)
    }

    this.valid = false
    if (this.locationMap.delete(locName)) {
      this.changelog.newRemove(loc)
      if (this._selectedName === locName) {
        this.select(null)
      }
      return true
    }
    console.warn(`Failed to remove location ${locName}; not in locationMap`)
    return false
  }

  createEdge = (start: Location, end: Location, weight?: number) => {
    if (start.neighborNames.indexOf(end.name) === -1)
      start.neighborNames.push(end.name)
    if (end.neighborNames.indexOf(start.name) === -1)
      end.neighborNames.push(start.name)

    const key = getEdgeKey(start, end)
    if (this.edgeMap.has(key)) return false

    const E = new Edge(start, end, this, weight)
    this.edgeMap.set(key, E)
    this.changelog.newAdd(E)
    this.valid = false
    return true
  }

  modEdge = (edge: Readonly<Edge>, diff: EdgeMutable) => {
    let ret = true
    const E = this.edgeMap.get(edge.key)
    if (!E) {
      console.debug('modEdge called on unregistered Edge')
      return false
    }

    if (diff.weight !== undefined) {
      const {weight} = E
      E.weight = diff.weight
      this.changelog.newMutateEdge(E, 'weight', weight, diff.weight)
    }
    this.valid = false
    return ret
  }

  removeEdge = (start: Location, end: Location) => {
    const startNNidx = start.neighborNames.indexOf(end.name)
    const endNNidx = end.neighborNames.indexOf(start.name)
    const edgeKey = getEdgeKey(start, end)
    if (startNNidx === -1 || endNNidx === -1) {
      console.warn(`failed to remove edge (${edgeKey}), not in neighbor lists`)
      return false
    }
    start.neighborNames.splice(startNNidx, 1)
    end.neighborNames.splice(endNNidx, 1)
    const E = this.edgeMap.get(edgeKey)
    if (!E || !this.edgeMap.delete(edgeKey)) {
      console.warn(`failed to remove edge (${edgeKey}), not in edgeMap`)
      return false
      // TODO: this is definitely not good for changelog state consistency
    }

    this.changelog.newRemove(E)
    if (this._selectedName === edgeKey) {
      this.select(null)
    }
    this.valid = false
    return true
  }

  private setImg = (mapImg: HTMLImageElement | null) => {
    if (mapImg !== this.img) {
      if (mapImg)
        console.debug(`updating image; src ${mapImg.src ? 'is' : 'not'} loaded`)
      else console.debug('updating image to null')
      this.img = mapImg
      this.valid = false
    } else {
      console.debug('not updating image, unchanged')
    }
  }

  /**
   * Find the first Location at the provided point, or null.
   */
  getFirstLocationAt = (point: Pointed) => {
    const iter = this.locationMap.values()

    let locIter = iter.next()
    while (!locIter.done) {
      if (locIter.value.shape.contains(point)) return locIter.value
      locIter = iter.next()
    }

    return null
  }

  /**
   * Find the first Edge at the provided point, or null.
   */
  getFirstEdgeAt = (point: Pointed) => {
    for (const edge of this.edgeMap.values()) {
      if (edge.connection.contains(point)) return edge
    }
    return null
  }

  private prepCanvas = () => {
    console.debug('prepCanvas')
    const ctx = this.canvas.getContext('2d')
    if (ctx) {
      ctx.font = 'Courier New 10pt'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
    }
    // add all our event listeners
    this.canvas.addEventListener('mousedown', this.mouseDownHandler, true)
    this.canvas.addEventListener('mouseup', this.mouseUpHandler, true)
    this.canvas.addEventListener('dblclick', this.dblClickHandler, true)
    // re/set the drawing interval
    if (this.intervalID) clearInterval(this.intervalID)
    this.intervalID = setInterval(this.draw, this.refreshInterval)
    this.valid = false
  }

  private clear = (ctx: CanvasRenderingContext2D | null = null) => {
    if (!ctx) ctx = this.canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private draw = () => {
    if (!this.valid) {
      requestAnimationFrame(this._draw)
      this.valid = true
    }
  }

  private _draw = (time: DOMHighResTimeStamp) => {
    console.log(time)

    const ctx = this.canvas.getContext('2d')
    if (!ctx) return
    this.clear(ctx)

    if (this.img) ctx.drawImage(this.img, 0, 0)

    const iter1 = this.edgeMap.values()
    let edgeIter = iter1.next()
    while (!edgeIter.done) {
      this._drawEdge(ctx, edgeIter.value)
      edgeIter = iter1.next()
    }

    const iter2 = this.locationMap.values()
    let locIter = iter2.next()
    while (!locIter.done) {
      this._drawLoc(ctx, locIter.value)
      locIter = iter2.next()
    }
  }

  private _drawLoc(ctx: CanvasRenderingContext2D, loc: Location) {
    if (this.selectionStroke && this.selection === loc) {
      loc.draw(ctx, this.selectionStroke)
    } else {
      loc.draw(ctx)
    }
  }

  private _drawEdge(ctx: CanvasRenderingContext2D, edge: Edge) {
    if (edge === this.selection) {
      const {stroke} = edge.connection
      // temp change selected stroke
      edge.connection.stroke = this.selectionStroke
      try {
        edge.connection.draw(ctx)
      } finally {
        // reset stroke
        edge.connection.stroke = stroke
      }
    } else {
      edge.connection.draw(ctx)
    }
  }

  dblClickHandler = (e: MouseEvent) => {
    this.createLocAtMouse(this._findMouse(e))
    this.valid = false
  }

  select = (
    keyname: string | null,
    updateReact = true,
    dragoff: Pointed | null = null
  ) => {
    let S: Location | Edge | null | undefined

    if (!keyname) {
      // deselect
      S = null
      this.dragoff = null
    } else if (keyname.includes('\t')) {
      // edge
      S = this.edgeMap.get(keyname)
      this.dragoff = null
    } else {
      // Location
      S = this.locationMap.get(keyname)
      this.dragoff = dragoff
    }
    if (S == undefined) {
      console.debug('select() on unknown key', keyname)
    }

    this._selection = S || null
    this._selectedName = keyname || null

    this.valid = false

    if (updateReact && this.updateReact) {
      this.updateReact()
    }
  }

  createLocAtMouse = (point: Pointed, select = true) => {
    const name = base64(Date.now() % 1e12) //`(${point.x},${point.y})`
    const loc = new Location(
      {name, x: point.x, y: point.y, neighborNames: []},
      this
    )

    if (!this.addLoc(loc)) return null

    if (select) {
      this.select(name)
    }

    return loc
  }

  /**
   * Handles clicking on the canvas, including de/selecting locations/edges.
   */
  mouseDownHandler = (e: MouseEvent) => {
    const prevSelected = this.selection
    const point = this._findMouse(e)
    let selectedLoc =
      this.getFirstLocationAt(point) || this.getFirstEdgeAt(point)

    console.debug('prevSelected:', prevSelected, 'selected:', selectedLoc)
    const isAddMod = e[this.addMod]

    if (selectedLoc instanceof Location) {
      // selected a location
      if (
        prevSelected instanceof Location &&
        prevSelected !== selectedLoc &&
        isAddMod
      ) {
        // Add-Modifier is held, so we're linking between two Locations
        const key = getEdgeKey(prevSelected, selectedLoc)
        if (this.edgeMap.has(key)) {
          // edge exists; select the EDGE
          this.select(key)
        } else {
          // no edge; create new edge, keep selecting LOCATION
          this.createEdge(prevSelected, selectedLoc)
          this.select(selectedLoc.name)
        }
      } else {
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler, true)
        const {x, y} = selectedLoc
        this.select(selectedLoc.name, false, diffPointed(point, {x, y}))
        this.changelog.newGrab(selectedLoc, {x, y})
      }
    } else if (selectedLoc instanceof Edge) {
      // selected an edge; that's not really an option yet though
      console.debug('AN EDGE', selectedLoc)
      this.select(selectedLoc.key)
    } else if (prevSelected instanceof Location && !selectedLoc && isAddMod) {
      // Add-Modifier is held and prevSelected, create a Location and Edge
      const newLoc = this.createLocAtMouse(point)
      if (newLoc) {
        this.createEdge(prevSelected, newLoc)
      }
    } else if (this.selectedName) {
      this.select(null)
    }
  }

  mouseUpHandler = (e: MouseEvent) => {
    const {selection} = this
    if (selection instanceof Location) {
      const {x, y} = selection
      this.changelog.newDrop(selection, {x, y})
    }
    this.dragoff = null
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler, true)
  }

  mouseMoveHandler = (e: MouseEvent) => {
    /* conditionals for doing the mouseMove handler:
     *  1. valid: limits movements to occur only after a draw has occurred
     *  2. dragoff: only relevant when dragging
     *  3. selection: only relevant if we're selecting a Location
     */
    if (this.valid && this.dragoff && this.selection instanceof Location) {
      const point = this._findMouse(e)

      diffPointed(point, this.dragoff, this.selection)
      this.valid = false
    }
  }

  /**
   * Find the coordinates of the mouse relative to the canvas.
   *
   */
  private _findMouse = (e: MouseEvent): Pointed => {
    const {currentTarget, pageX, pageY} = e
    var element = currentTarget as HTMLElement | null,
      offsetX = 0,
      offsetY = 0

    while (element) {
      offsetX += element.offsetLeft
      offsetY += element.offsetTop
      element = element.offsetParent as HTMLElement | null
    }

    return {
      x: pageX - offsetX,
      y: pageY - offsetY,
    }
  }

  static defaultLabelStyler(loc: Readonly<Location>) {
    return {fill: 'rgba(204,0,0,0.9)', font: 'Courier New 10pt'}
  }

  static defaultLocStyler(loc: Readonly<Location>) {
    return {fill: 'rgba(0,255,127,.9)'}
  }

  /**
   * Try to get a shape name from the LocationLike data, defaults to Circle.
   */
  static defaultLocShaper<T extends ShapeParams>(
    loc: Location<Shape<T>> | LocationLike & T & {shape?: any}
  ): [ShapeSubclass<T>, T] {
    let shapeC: ShapeSubclass<any> | undefined
    if (loc.shape) {
      // loc has a property 'shape'; see if it's meaningful
      if (typeof loc.shape == 'string') {
        shapeC = ShapeMap[loc.shape]
      } else if (loc.shape instanceof Shape)
        shapeC = loc.shape.constructor as ShapeSubclass<any>
      else if (loc.shape.prototype && loc.shape.prototype instanceof Shape)
        shapeC = loc.shape.prototype.constructor
    }
    if (!shapeC && loc instanceof Location && loc.data.shape) {
      shapeC = ShapeMap[loc.data.shape]
    }

    if (!shapeC) shapeC = ShapeMap.Circle
    return [shapeC, (CanvasStore.defaultShapeProperties() as unknown) as T]
  }

  static defaultShapeProperties() {
    return {
      radius: DEFAULT_RADIUS,
      width: 2 * DEFAULT_RADIUS,
      height: 2 * DEFAULT_RADIUS,
      sidelength: DEFAULT_RADIUS,
    }
  }
}
