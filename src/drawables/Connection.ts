import Drawable from './Drawable'
import {CanvasStyleType} from '../interfaces'
import {numAvg, midPointed} from '../utils'

export interface ConnectionParams {
  start: Drawable
  end: Drawable
  stroke?: CanvasStyleType
  strokeWidth?: number
}

export default class Connection extends Drawable {
  readonly start: Drawable
  readonly end: Drawable
  stroke: CanvasStyleType = '#000'
  strokeWidth: number = 3

  get x() {
    return numAvg(this.start.x, this.end.x)
  }

  get y() {
    return numAvg(this.start.y, this.end.y)
  }

  get width() {
    return Math.abs(this.start.x - this.end.x)
  }

  get height() {
    return Math.abs(this.start.y - this.end.y)
  }

  get length() {
    return Math.sqrt(this.width ** 2 + this.height ** 2)
  }

  constructor(params: ConnectionParams) {
    super(Object.assign(midPointed(params.start, params.end), params))

    this.start = params.start
    this.end = params.end
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath()
    ctx.strokeStyle = this.stroke
    ctx.lineWidth = this.strokeWidth
    ctx.moveTo(this.start.x, this.start.y)
    ctx.lineTo(this.end.x, this.end.y)
    ctx.stroke()
  }
}
