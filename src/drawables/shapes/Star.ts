import Shape, {ShapeParams} from './Shape'
import {GeometryError} from '../../errors'

const ROTATION_FACTOR = (2 * Math.PI) / 10 // alpha

export interface StarParams extends ShapeParams {
  radius: number
}

export default class Star extends Shape<StarParams> {
  radius: number

  get width() {
    return 2 * this.radius
  }
  get height() {
    return 2 * this.radius
  }

  constructor(params: StarParams) {
    super(params)
    this.radius = params.radius

    if (this.radius <= 0)
      throw new GeometryError(`Star radius ${this.radius} invalid`)
  }

  /**
   * Based on code by ChrisIPowell and Nycholas Weissenberg on StackOverflow.
   * @link https://stackoverflow.com/a/17279374
   */
  doPath(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    for (let i = 11; i > 0; i--) {
      const R = (this.radius * ((i % 2) + 1)) / 2
      const omega = ROTATION_FACTOR * i
      ctx.lineTo(R * Math.sin(omega) + this.x, R * Math.cos(omega) + this.y)
    }
    ctx.closePath()
  }
}
