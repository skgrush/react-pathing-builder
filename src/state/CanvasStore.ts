import Location from './Location'
import Edge, {getEdgeKey} from './Edge'
import {Shape, Star} from '../drawables'
import {Pointed, CanvasStyleType} from '../interfaces'
import {UniquenessError} from '../errors'

export type ClickModifier = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'
const CLICK_MODIFIERS = Object.freeze([
  'altKey',
  'ctrlKey',
  'metaKey',
  'shiftKey',
] as ClickModifier[])

interface Parameters {
  img?: HTMLImageElement | null
  canvas?: HTMLCanvasElement
  refreshInterval?: number
  pixelOffset?: Pointed
  weightScale?: number
  addMod?: ClickModifier
  selectionStroke?: CanvasStyleType
}

export default class CanvasStore {
  private img: HTMLImageElement | null = null
  private canvas: HTMLCanvasElement
  private refreshInterval: number = Math.floor(1000 / 15)
  private pixelOffset: Pointed | null = null
  private valid: boolean = false
  private dragging: boolean = false
  private dragoff: Pointed | null = null
  private selectedName: string | null = null
  private intervalID: number | null = null
  private weightScaleMult: number = 1
  private addMod: ClickModifier = 'shiftKey'
  private selectionStroke: CanvasStyleType = '#C00'

  locationMap: Map<string, Location> = new Map()
  edgeMap: Map<string, Edge> = new Map()

  get selection() {
    if (!this.selectedName) return null
    if (this.selectedName.includes('\t'))
      return this.edgeMap.get(this.selectedName) || null
    return this.locationMap.get(this.selectedName) || null
  }

  get mapImg() {
    return this.img
  }

  get weightScale() {
    return this.weightScaleMult
  }

  constructor(params: Parameters & {canvas: HTMLCanvasElement}) {
    ;(window as any).canvasStore = this
    this.canvas = params.canvas
    this.updateParams(params, true)
  }

  loadData = (data: any) => {
    // TODO
    throw 'loadData not implemented'
  }

  updateParams = (params: Parameters, first?: boolean) => {
    console.debug('updateParams', params)
    const {img, pixelOffset, canvas, refreshInterval, selectionStroke} = params

    if (img !== undefined) this.setImg(img)

    if (selectionStroke !== undefined) this.selectionStroke = selectionStroke

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
    this.valid = false
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

    return this.locationMap.delete(locName)
  }

  createEdge = (start: Location, end: Location, weight?: number) => {
    if (start.neighborNames.indexOf(end.name) === -1)
      start.neighborNames.push(end.name)
    if (end.neighborNames.indexOf(start.name) === -1)
      end.neighborNames.push(start.name)

    const key = getEdgeKey(start, end)
    const existingEdge = this.edgeMap.get(key)
    if (existingEdge) return existingEdge

    const E = new Edge(start, end, this, weight)
    this.edgeMap.set(key, E)
    return E
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
    if (!this.edgeMap.delete(edgeKey)) {
      console.warn(`failed to remove edge (${edgeKey}), not in edgeMap`)
      return false
    }
    return true
  }

  setImg = (mapImg: HTMLImageElement | null) => {
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

  prepCanvas = () => {
    console.debug('prepCanvas')
    // add all our event listeners
    this.canvas.addEventListener('mousedown', this.mouseDownHandler, true)
    this.canvas.addEventListener('mouseup', this.mouseUpHandler, true)
    this.canvas.addEventListener('dblclick', this.dblClickHandler, true)
    // re/set the drawing interval
    if (this.intervalID) clearInterval(this.intervalID)
    this.intervalID = setInterval(this.draw, this.refreshInterval)
    this.valid = false
  }

  clear = (ctx: CanvasRenderingContext2D | null = null) => {
    if (!ctx) ctx = this.canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  draw = () => {
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
    if (loc === this.selection) {
      const {stroke, strokeWidth} = loc.shape
      // temporarily change selected stroke
      loc.shape.stroke = this.selectionStroke
      loc.shape.strokeWidth = 2
      try {
        // draw it
        loc.shape.draw(ctx)
      } finally {
        // reset stroke
        loc.shape.stroke = stroke
        loc.shape.strokeWidth = strokeWidth
      }
    } else {
      loc.shape.draw(ctx)
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
    const point = this._findMouse(e)
    const name = `(${point.x},${point.y})`
    const shapeParams = {radius: 20, fill: 'rgba(0,255,0,.6)'}
    this.addLoc(
      new Location(
        {name, x: point.x, y: point.y, neighborNames: []},
        Star,
        shapeParams
      )
    )
  }

  /**
   * Handles clicking on the canvas, including de/selecting locations/edges.
   */
  mouseDownHandler = (e: MouseEvent) => {
    const prevSelected = this.selection
    const point = this._findMouse(e)
    const selectedLoc = this.getFirstLocationAt(point)
    console.debug('prevSelected:', prevSelected, 'selected:', selectedLoc)

    if (selectedLoc instanceof Location) {
      this.valid = false
      this.selectedName = selectedLoc.name
      if (
        prevSelected instanceof Location &&
        prevSelected !== selectedLoc &&
        e[this.addMod]
      ) {
        // linking between two locations; either create one or select it
        const edge = this.createEdge(prevSelected, selectedLoc)
        this.selectedName = edge.key
      } else {
        this.dragging = true
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler, true)
        this.dragoff = {
          x: point.x - selectedLoc.x,
          y: point.y - selectedLoc.y,
        }
      }
    } else if (<any>selectedLoc instanceof Edge) {
      // selected an edge
    } else if (this.selectedName) {
      this.valid = false
      this.selectedName = null
    }
  }

  mouseUpHandler = (e: MouseEvent) => {
    this.dragging = false
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
      this.selection.x = point.x - this.dragoff.x
      this.selection.y = point.y - this.dragoff.y
      this.valid = false
    }
  }

  _findMouse = (e: MouseEvent): Pointed => {
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
}
