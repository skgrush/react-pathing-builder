import {CanvasStyleType, Pointed} from '../interfaces'

export interface DrawableParams {
  x: number
  y: number
  fill?: CanvasStyleType
  stroke?: CanvasStyleType
  strokeWidth?: number
}

export default abstract class Drawable {
  x: number
  y: number
  fill?: CanvasStyleType
  stroke?: CanvasStyleType
  strokeWidth: number
  abstract get width(): number
  abstract get height(): number

  constructor({x, y, fill, stroke, strokeWidth}: DrawableParams) {
    this.x = x
    this.y = y
    this.fill = fill
    this.stroke = stroke
    this.strokeWidth = strokeWidth || 0
  }

  abstract readonly draw: (ctx: CanvasRenderingContext2D) => void

  moveTo = (x: number, y: number) => {
    this.x = x
    this.y = y
  }

  /**
   * Calculate if a point lies within the bounding-box of a Drawable.
   */
  contains = ({x, y}: Pointed) => {
    console.debug('dis:', this)
    console.debug({x: this.x, y: this.y}, 'contains:', {x, y}, 'diff:', [
      this.width,
      this.height,
    ])
    return (
      Math.abs(this.x - x) <= this.width / 2 &&
      Math.abs(this.y - y) <= this.height / 2
    )
  }
}
