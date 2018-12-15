import Location from './Location'
import {Shape, Star} from '../drawables'
import {Pointed} from '../interfaces'
import {UniquenessError} from '../errors'

interface Parameters {
  img?: HTMLImageElement | null
  canvas?: HTMLCanvasElement
  refreshInterval?: number
  pixelOffset?: Pointed
}
const ParameterKeys = Object.freeze([
  'img',
  'canvas',
  'refreshInterval',
  'pixelOffset',
] as Array<keyof Parameters>)

export default class CanvasStore {
  img: HTMLImageElement | null = null
  private canvas: HTMLCanvasElement
  private refreshInterval: number = Math.floor(1000 / 15)
  private pixelOffset: Pointed | null = null
  private valid: boolean = false
  private dragging: boolean = false
  private dragoff: Pointed | null = null
  private selectedName: string | null = null
  private intervalID: number | null = null

  locationMap: Map<string, Location<Shape>> = new Map()

  get selection() {
    return this.locationMap.get(this.selectedName as string) || null
  }

  constructor(params: Parameters & {canvas: HTMLCanvasElement}) {
    ;(window as any).canvasStore = this
    this.canvas = params.canvas
    this.updateParams(params, true)
  }

  updateParams = (params: Parameters, first?: boolean) => {
    console.debug('updateParams', params)
    const {img, pixelOffset, canvas, refreshInterval} = params

    if (img !== undefined) this.setImg(img)

    if (pixelOffset) {
      const {x, y} = pixelOffset
      this.pixelOffset = Object.assign(this.pixelOffset || {}, {x, y})
    }

    if ((canvas && this.canvas !== canvas) || refreshInterval || first) {
      if (canvas) this.canvas = canvas
      if (refreshInterval) this.refreshInterval = refreshInterval
      this.prepCanvas()
    }
  }

  addLoc = (loc: Location<Shape>) => {
    if (!loc.name) {
      throw new UniquenessError(`Failed to add location ""`)
    }
    if (this.locationMap.has(loc.name))
      throw new UniquenessError(`Failed to add duplicate location ${loc.name}`)
    this.locationMap.set(loc.name, loc)
    this.valid = false
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

    const iter = this.locationMap.values()
    let locIter = iter.next()
    while (!locIter.done) {
      const loc = locIter.value
      if (loc === this.selection) {
        const {stroke, strokeWidth} = loc.shape
        // temporarily change selected stroke
        loc.shape.stroke = '#C00'
        loc.shape.strokeWidth = 2
        // draw it
        loc.shape.draw(ctx)
        // reset stroke
        loc.shape.stroke = stroke
        loc.shape.strokeWidth = strokeWidth
      } else {
        locIter.value.shape.draw(ctx)
      }
      locIter = iter.next()
    }
  }

  dblClickHandler = (e: MouseEvent) => {
    const point = this._findMouse(e)
    const name = `(${point.x},${point.y})`
    const shapeParams = {radius: 20, fill: 'rgba(0,255,0,.6)'}
    this.addLoc(
      new Location<Shape>(
        {name, x: point.x, y: point.y, neighborNames: []},
        Star,
        shapeParams
      )
    )
  }

  mouseDownHandler = (e: MouseEvent) => {
    const point = this._findMouse(e)
    const selectedLoc = this.getFirstLocationAt(point)
    console.debug('selected:', selectedLoc)
    if (selectedLoc) {
      this.valid = false
      this.dragging = true
      this.canvas.addEventListener('mousemove', this.mouseMoveHandler, true)
      this.selectedName = selectedLoc.name
      this.dragoff = {
        x: point.x - selectedLoc.x,
        y: point.y - selectedLoc.y,
      }
    } else if (this.selectedName) {
      this.valid = false
      this.selectedName = null
    }
  }

  mouseUpHandler = (e: MouseEvent) => {
    this.dragging = false
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler, true)
  }

  mouseMoveHandler = (e: MouseEvent) => {
    /* conditionals for doing the mouseMove handler:
     *  1. valid: limits movements to occur only after a draw has occurred
     *  2. dragging|dragoff: only relevant when dragging
     *  3.
     */
    if (this.valid && this.dragging && this.selection && this.dragoff) {
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
