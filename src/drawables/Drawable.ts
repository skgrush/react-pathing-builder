import {CanvasStyleType, StylableParams, Pointed} from '../interfaces'

/** adds {x, y}, extends {fill?, stroke?, width?} */
export interface DrawableParams extends StylableParams {
  x: number
  y: number
}

/**
 * Abstract Drawable thing.
 *
 * @class Drawable
 * @property {number} x - X-coordinate of the center
 * @property {number} y - Y-coordinate of the center
 * @property {CanvasStyleType} [fill]   - Optional fillStyle for the thing
 * @property {CanvasStyleType} [stroke] - Optional strokeStyle for the thing
 */
export default abstract class Drawable implements DrawableParams {
  /** x-coordinate of the center */
  x: number
  /** y-coordinate of the center */
  y: number
  /** Optional canvas fillStyle; fill() is only called if this is set */
  fill?: CanvasStyleType
  /** Optional canvas strokeStyle; stroke() only called if this is set */
  stroke?: CanvasStyleType
  /** Canvas lineWidth of stroke; set to 0 if not provided as parameter */
  strokeWidth: number

  /** @abstract width implemented by Drawables. */
  abstract get width(): number
  /** @abstract height implemented by Drawables. */
  abstract get height(): number

  constructor({x, y, fill, stroke, strokeWidth}: DrawableParams) {
    this.x = x
    this.y = y
    this.fill = fill
    this.stroke = stroke
    this.strokeWidth = strokeWidth || 0
  }

  abstract draw(ctx: CanvasRenderingContext2D): void

  /**
   * Move the Drawable's center to the given location.
   * Makes sure that dependent objects are updated.
   */
  moveTo(x: number, y: number) {
    this.x = x
    this.y = y
  }

  /**
   * Calculate if a point lies within the bounding-box of a Drawable.
   */
  contains({x, y}: Pointed) {
    return (
      Math.abs(this.x - x) <= this.width / 2 &&
      Math.abs(this.y - y) <= this.height / 2
    )
  }
}
