import Shape, {ShapeParams} from './Shape'
import {GeometryError} from '../../errors'

export interface StarParams extends ShapeParams {
  radius: number
  points?: number
}

export default class Star extends Shape<StarParams> {
  radius: number
  points: number

  get width() {
    return 2 * this.radius
  }
  get height() {
    return 2 * this.radius
  }
  get rotationFactor() {
    return Math.PI / this.points
  }

  constructor(params: StarParams) {
    super(params)
    this.radius = params.radius
    this.points = params.points || 5

    if (this.radius <= 0)
      throw new GeometryError(`Star radius ${this.radius} invalid`)
    if (params.hasOwnProperty('points') && params.points && params.points <= 3)
      throw new GeometryError(`Star must have 4+ points, got ${params.points}`)
  }

  /**
   * Based on code by ChrisIPowell and Nycholas Weissenberg on StackOverflow.
   * @link https://stackoverflow.com/a/17279374
   */
  doPath(ctx: CanvasRenderingContext2D) {
    const {rotationFactor} = this
    const iterations = this.points * 2
    ctx.beginPath()
    for (let i = iterations; i > 0; i--) {
      const R = (this.radius * ((i % 2) + 1)) / 2
      const omega = rotationFactor * i
      ctx.lineTo(R * Math.sin(omega) + this.x, R * Math.cos(omega) + this.y)
    }
    ctx.closePath()
  }
}
