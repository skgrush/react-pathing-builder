import Location, {
  LocationLike,
  LocationMutableProps,
  isLocationLike,
} from './Location'
import Edge, {getEdgeKey, EdgeMutable, EdgeLike, isEdgeLike} from './Edge'
import {Star, Shape, ShapeMap, ShapeSubclass, ShapeParams} from '../drawables'
import {
  Pointed,
  CanvasStyleType,
  LocationStyler,
  LocationShaper,
  LabelStyler,
  LocationExport,
  EdgeExport,
  ExportSimple,
  DimensionBox,
} from '../interfaces'
import {
  diffPointed,
  b64time,
  ClickModifier,
  CLICK_MODIFIERS,
  modifiers,
  isUndo,
  isRedo,
  MODIFIER_KEYS,
  handleArrowKey,
  scalePointed,
  drawCornerText,
} from '../utils'
import {UniquenessError} from '../errors'
import ChangeStore from './changes/ChangeStore'

const DEFAULT_RADIUS = 10

/**
 * The arguments and modifiable-properties of CanvasStore.
 * Can be passed to the constructor or updateParams().
 * See the associated properties on CanvasStore for descriptions.
 */
interface Parameters {
  img?: HTMLImageElement | null
  canvas?: HTMLCanvasElement
  scaleRatio?: number
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
  /** factor to scale the canvas by */
  private scaleRatio: number = 1
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
  /** Key of selected Location or Edge, else null. */
  private _selectedKey: string | null = null
  /** Selected Location | Edge | null. */
  private _selection: Location | Edge | null = null
  /** ID from setInterval in prepCanvas() */
  private intervalID: number | null = null
  /** Log of changes to the state; implements undo/redo */
  readonly changelog: ChangeStore

  /** map currently-added Location-keys to Locations. */
  private readonly locationMap: Map<string, Location> = new Map()
  /** map currently-added Edge-keys to Edges. */
  private readonly edgeMap: Map<string, Edge> = new Map()

  get isEmpty() {
    const {locationMap, edgeMap} = this
    return locationMap.size === 0 && edgeMap.size === 0
  }

  get selectedKey() {
    return this._selectedKey
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

  /**
   * internal dimensions of the canvas in pixels.
   */
  get canvasDimensions(): DimensionBox {
    return {
      width: this.canvas.width / this.scaleRatio,
      height: this.canvas.height / this.scaleRatio,
    }
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

  /**
   * Takes an (arbitrarily-ordered) array of LocationLike and EdgeLike objects
   * and adds them to a freshly-cleared CanvasStore.
   * Returns a 2-tuple, the numerator/denominator of the fraction of successful
   * loads of Locations and Edges.
   */
  loadData = (
    data: ExportSimple | any[],
    updateReact = true
  ): [number, number] => {
    this.clear(false)
    if (!data) return [0, 0]
    if (!Array.isArray(data)) {
      // data's not an array, but it is truthy
      if (data.hasOwnProperty('locations') && data.hasOwnProperty('edges')) {
        // data's probably an ExportSimple
        return this.importData(data, updateReact)
      }
      // I don't know what data is. Just convert it to an array.
      data = [data]
    }

    // data is definitely an array. Pull out the Edges, load the Locations
    const edgeLikes: EdgeLike[] = []
    let successCount = 0,
      totalCount = 0
    for (const datum of data) {
      if (isEdgeLike(datum)) {
        edgeLikes.push(datum)
      } else {
        successCount += +this._loadLoc(datum)
        totalCount += 1
      }
    }
    console.debug(`Loaded ${successCount} of ${totalCount} Locations.`)
    // now that the Locations are presumably loaded, load the Edges
    for (const edgey of edgeLikes) {
      successCount += +this._loadEdge(edgey)
      totalCount += 1
    }
    console.debug(
      `loadData() loaded ${successCount} of ${totalCount} Locations and Edges.`
    )

    if (updateReact && this.updateReact) {
      this.updateReact()
    }
    return [successCount, totalCount]
  }

  /**
   * Import data from a more strict ExportSimple object like from exportData()
   */
  importData = (ES: ExportSimple, updateReact = true): [number, number] => {
    let successCount = 0,
      totalCount = 0

    if (Array.isArray(ES.locations)) {
      for (const loc of ES.locations) {
        successCount += +this._loadLoc(loc)
        totalCount += 1
      }
    }
    if (Array.isArray(ES.edges)) {
      for (const edge of ES.edges) {
        successCount += +this._loadEdge(edge)
        totalCount += 1
      }
    }

    if (updateReact && this.updateReact) {
      this.updateReact()
    }
    return [successCount, totalCount]
  }

  exportData = (): ExportSimple => {
    const locations = this.locationMap.size
      ? [...this.locationMap.values()].map(L => L.toObject())
      : []
    const edges = this.edgeMap.size
      ? [...this.edgeMap.values()].map(E => E.toObject())
      : []

    return {locations, edges}
  }

  /**
   * Wipe all data loaded into the stores and clear the canvas.
   */
  clear = (updateReact = true) => {
    this.locationMap.clear()
    this.edgeMap.clear()

    this.changelog.clear()

    this.select(null, false)
    this.clearCanvas()
    if (updateReact && this.updateReact) {
      this.updateReact()
    }
  }

  /**
   * Public parameter updater.
   *
   * @param {Parameters} params - new partial parameters
   * @param {boolean} [first=false] - if true, force prepping canvas
   */
  updateParams = (params: Parameters, first?: boolean) => {
    console.debug('updateParams', params)
    const {
      img,
      pixelOffset,
      canvas,
      refreshInterval,
      selectionStroke,
      scaleRatio,
    } = params

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

    if (
      (canvas && this.canvas !== canvas) ||
      refreshInterval ||
      first ||
      scaleRatio
    ) {
      if (canvas) this.canvas = canvas
      if (refreshInterval) this.refreshInterval = refreshInterval
      if (scaleRatio) this.scaleRatio = scaleRatio
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

  addLoc = (loc: Location, doAddChange: boolean = true) => {
    if (!loc.key) {
      throw new UniquenessError(`Failed to add location ""`)
    }
    if (loc.key.includes('\t')) {
      throw new Error("Location key contains illegal character '\\t'")
    }
    if (this.locationMap.has(loc.key))
      throw new UniquenessError(`Failed to add duplicate location ${loc.key}`)

    this.locationMap.set(loc.key, loc)
    if (doAddChange) this.changelog.newAdd(loc)
    this.valid = false
    return true
  }

  modLoc = (loc: Readonly<Location>, diff: LocationMutableProps) => {
    let ret = true
    const L = this.locationMap.get(loc.key)
    if (!L) {
      console.debug('modLoc called on unregistered Location')
      return false
    }

    if (diff.name) {
      const oldName = L.name
      L.name = diff.name
      this.changelog.newMutateLoc(L, 'name', oldName, diff.name)
    }
    if (diff.shape) {
      const oldShape = L.shape
      if (ShapeMap.hasOwnProperty(diff.shape)) {
        const shapeClass = ShapeMap[diff.shape]
        if (!shapeClass) {
          console.warn(`ShapeMap[${diff.shape}] -> ${shapeClass}`)
          ret = false
        } else {
          const newShape = L.updateShape(shapeClass)
          if (newShape) {
            this.changelog.newMutateLoc(L, 'shape', oldShape, newShape)
            // update edges
            this.edgeMap.forEach(E => {
              if (E.start === loc) E.connection.start = newShape
              if (E.end === loc) E.connection.end = newShape
            })
          } else {
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
      if (x === undefined) x = oldX
      if (y === undefined) y = oldY
      this.changelog.newGrab(L, L)
      L.moveTo({x, y})
      this.changelog.newDrop(L, {x, y})
    }
    this.valid = false
    return ret
  }

  removeLoc = (locIn: Readonly<Location>) => {
    const key = locIn.key
    const loc = this.locationMap.get(key)
    if (!loc) return false

    for (const neighborKey of [...loc.neighborKeys]) {
      const neighbor = this.locationMap.get(neighborKey)
      if (!neighbor) {
        console.warn(`loc ${key} has missing neighbor ${neighborKey}`)
        continue
      }
      this.removeEdgePair(loc, neighbor)
    }

    this.valid = false
    if (this.locationMap.delete(key)) {
      this.changelog.newRemove(loc)
      if (this._selectedKey === key) {
        this.select(null)
      }
      return true
    }
    console.warn(`Failed to remove location ${key}; not in locationMap`)
    return false
  }

  createEdge = (
    start: Location,
    end: Location,
    weight?: number,
    doAddChange: boolean = true
  ) => {
    if (start.neighborKeys.indexOf(end.key) === -1)
      start.neighborKeys.push(end.key)
    if (end.neighborKeys.indexOf(start.key) === -1)
      end.neighborKeys.push(start.key)

    const key = getEdgeKey(start, end)
    if (this.edgeMap.has(key)) return false

    const E = new Edge(start, end, this, weight)
    this.edgeMap.set(key, E)
    if (doAddChange) this.changelog.newAdd(E)
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

  removeEdge = (edge: Readonly<Edge>) =>
    this.removeEdgePair(edge.start, edge.end)

  removeEdgePair = (start: Location, end: Location) => {
    const startNNidx = start.neighborKeys.indexOf(end.key)
    const endNNidx = end.neighborKeys.indexOf(start.key)
    const edgeKey = getEdgeKey(start, end)
    if (startNNidx === -1 || endNNidx === -1) {
      console.warn(`failed to remove edge (${edgeKey}), not in neighbor lists`)
      return false
    }
    start.neighborKeys.splice(startNNidx, 1)
    end.neighborKeys.splice(endNNidx, 1)
    const E = this.edgeMap.get(edgeKey)
    if (!E || !this.edgeMap.delete(edgeKey)) {
      console.warn(`failed to remove edge (${edgeKey}), not in edgeMap`)
      return false
      // TODO: this is definitely not good for changelog state consistency
    }

    this.changelog.newRemove(E)
    if (this._selectedKey === edgeKey) {
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
      ctx.font = '10pt Courier New'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      this.resetTransform(ctx)
    }
    // add all our event listeners
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler, true)
    this.canvas.addEventListener('mousedown', this.mouseDownHandler, true)
    this.canvas.addEventListener('dblclick', this.dblClickHandler, true)
    this.canvas.addEventListener('keydown', this.keyDownHandler, true)
    // re/set the drawing interval
    if (this.intervalID) clearInterval(this.intervalID)
    this.intervalID = setInterval(this.draw, this.refreshInterval)
    this.valid = false
  }

  private clearCanvas(ctx: CanvasRenderingContext2D | null = null) {
    if (!ctx) ctx = this.canvas.getContext('2d')
    if (ctx) {
      const {width, height} = this.canvasDimensions
      ctx.clearRect(0, 0, width, height)
      return true
    }
    return false
  }

  private resetTransform(ctx: CanvasRenderingContext2D | null = null) {
    if (!ctx) ctx = this.canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(this.scaleRatio, 0, 0, this.scaleRatio, 0, 0)
    }
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
    this.clearCanvas(ctx)

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

  /**
   * helper for drawing the mouse coords at the bottom of the screen.
   * Expects to be called outside of the normal drawing cycle.
   */
  private _drawMouseCoords(coords: Pointed) {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return false
    return drawCornerText(
      `Mouse: (${coords.x}, ${coords.y})`,
      ctx,
      this.canvasDimensions,
      this.scaleRatio
    )
  }

  /**
   * Try to load an EdgeLike into the store WITHOUT adding to the changelog.
   * Returns `true` on success, returns `false` and prints an error to console
   * on failure.
   */
  private _loadEdge = (edge: EdgeLike | any) => {
    const start = this.locationMap.get(String(edge.start))
    const end = this.locationMap.get(String(edge.end))
    if (!start || !end) {
      console.error(
        'start or end Location not found in locationMap.',
        'Edge:',
        edge,
        '; start:',
        start,
        '; end:',
        end
      )
      return false
    } else {
      // Add the Edge, but DON'T add a changelog entry
      const succ = this.createEdge(start, end, edge.weight, false)
      if (!succ) {
        console.error('Edge apparently already exists', edge)
      }
      return succ
    }
  }

  /**
   * Try to load a LocationLike into the store WITHOUT adding to the changelog.
   * Returns: `true` on success, `false` and prints error on failure.
   */
  private _loadLoc = (something: LocationLike | any) => {
    if (!isLocationLike(something)) {
      console.error('Non-LocationLike object:', something)
      return false
    }
    if (!something.key) {
      // missing key name
      const name = String(something.name)
      if (this.locationMap.has(name)) {
        console.error(
          "LocationLike object is missing 'key', but 'name' " +
            'value is already in locationMap:',
          something
        )
        return false
      } else {
        something.key = name
      }
    }
    try {
      // Add the Location, but DON'T add a changelog entry
      return this.addLoc(new Location(something, this), false)
    } catch (e) {
      console.error(e)
      return false
    }
  }

  dblClickHandler = (e: MouseEvent) => {
    e.preventDefault()
    const R = this.createLocAtMouse(this._findMouse(e))
    if (R && this.updateReact) {
      this.updateReact()
    }
    this.valid = false
  }

  select = (
    key: string | null,
    updateReact = true,
    dragoff: Pointed | null = null
  ) => {
    let S: Location | Edge | null | undefined

    if (!key) {
      // deselect
      S = null
      this.dragoff = null
    } else if (key.includes('\t')) {
      // edge
      S = this.edgeMap.get(key)
      this.dragoff = null
    } else {
      // Location
      S = this.locationMap.get(key)
      this.dragoff = dragoff
    }
    if (S == undefined) {
      console.debug('select() on unknown key', key)
    }

    this._selection = S || null
    this._selectedKey = key || null

    this.valid = false

    if (updateReact && this.updateReact) {
      this.updateReact()
    }
  }

  createLocAtMouse = (point: Pointed, select = true) => {
    const key = b64time()
    const loc = new Location({key, name: key, x: point.x, y: point.y}, this)

    if (!this.addLoc(loc)) return null

    if (select) {
      this.select(key, false)
    }

    return loc
  }

  /**
   * Handles clicking on the canvas, including de/selecting locations/edges.
   */
  mouseDownHandler = (e: MouseEvent) => {
    if (e.buttons === 1 || (!e.buttons && e.button === 0)) {
      console.debug('mDH: button is primary', e)
    } else if (typeof e.button !== 'number' && typeof e.buttons !== 'number') {
      console.debug('mDH: no `button/s` property.', e)
    } else if (e.button !== 0 && e.buttons !== 1) {
      console.debug('mDH: non-primary button, returning.', e)
      return
    } else if (e.buttons !== 1) {
      console.debug('mDH: `buttons` =', e.buttons)
    } else {
      console.debug('mDH: e.button === e.buttons === 1', e)
    }
    e.preventDefault()

    if (document.activeElement !== this.canvas) this.canvas.focus()

    const prevSelected = this.selection
    const point = this._findMouse(e)
    let selectedLoc =
      this.getFirstLocationAt(point) || this.getFirstEdgeAt(point)

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
          this.select(selectedLoc.key)
        }
      } else {
        //this.canvas.addEventListener('mousemove', this.mouseMoveHandler, true)
        this.canvas.addEventListener('mouseup', this.mouseUpHandler, true)
        const {x, y} = selectedLoc
        this.select(selectedLoc.key, false, diffPointed(point, {x, y}))
        this.changelog.newGrab(selectedLoc, {x, y})
      }
    } else if (selectedLoc instanceof Edge) {
      // selected an edge; that's not really an option yet though
      this.select(selectedLoc.key)
    } else if (prevSelected instanceof Location && !selectedLoc && isAddMod) {
      // Add-Modifier is held and prevSelected, create a Location and Edge
      const newLoc = this.createLocAtMouse(point)
      if (newLoc) {
        this.createEdge(prevSelected, newLoc)
      }
    } else if (this.selectedKey) {
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
    //this.canvas.removeEventListener('mousemove', this.mouseMoveHandler, true)
    this.canvas.removeEventListener('mouseup', this.mouseUpHandler, true)
  }

  mouseMoveHandler = (e: MouseEvent) => {
    /* conditionals for doing the mouseMove handler:
     *  1. valid: limits movements to occur only after a draw has occurred
     *  2. dragoff: only relevant when dragging
     *  3. selection: only relevant if we're selecting a Location
     */
    if (this.valid && this.dragoff && this.selection instanceof Location) {
      const point = this._findMouse(e)

      // move the selection
      this.selection.moveTo(diffPointed(point, this.dragoff))
      this._drawMouseCoords(point)
      this.valid = false
    } else {
      this._drawMouseCoords(this._findMouse(e))
    }
  }

  keyDownHandler = (e: KeyboardEvent) => {
    if (MODIFIER_KEYS.indexOf(e.key) >= 0) return

    e.preventDefault()
    const {selection} = this

    switch (e.key) {
      case 'Backspace': // with no modifiers
      case 'Delete':
        if (selection && modifiers(e) === 0) {
          if (selection instanceof Location) this.removeLoc(selection)
          else if (selection instanceof Edge) this.removeEdge(selection)
          return
        }
        break

      case 'Undo':
      case 'z':
        if (isUndo(e)) {
          return this.changelog.undo()
        }
      // 'z' can be used for redo, so check it too next
      // don't break
      case 'Redo':
      case 'y':
        if (isRedo(e)) {
          return this.changelog.redo()
        }
        break

      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
        if (selection instanceof Location) {
          handleArrowKey(e, selection, this.modLoc, this.canvasDimensions)
          return
        }
        break
    }
    console.debug('unexpected keyDown:', e.key, e.code, e.char, e)
  }

  /**
   * Find the coordinates of the mouse relative to the canvas.
   */
  private _findMouse = (e: MouseEvent): Pointed => {
    const {currentTarget, pageX, pageY} = e

    /**
     * popular pattern for getting offset relative to an element from
     * its ancestor elements.
     */
    let element = currentTarget as HTMLElement | null,
      offsetX = 0,
      offsetY = 0
    while (element) {
      offsetX += element.offsetLeft
      offsetY += element.offsetTop
      element = element.offsetParent as HTMLElement | null
    }

    /**
     * where the mouse is relative to the canvas, NOT accounting for the
     * offset from the canvas's padding and border sizes.
     **/
    const point = {
      x: pageX - offsetX,
      y: pageY - offsetY,
    }

    if (this.pixelOffset) {
      // subtract pixelOffset from point in-place
      diffPointed(point, this.pixelOffset, point)
    }
    if (this.scaleRatio !== 1) {
      // scaled and rounded point
      scalePointed(point, 1 / this.scaleRatio, point, true)
    }
    return point
  }

  static defaultLabelStyler(loc: Readonly<Location>) {
    return {fill: 'rgba(204,0,0,0.9)', font: '10pt Courier New'}
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
