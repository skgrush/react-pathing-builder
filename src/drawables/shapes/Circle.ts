import Shape, {ShapeParams} from './Shape'
import {GeometryError} from '../../errors'
import {Pointed} from '../../interfaces'
import {euclideanDistance} from '../../utils'

export interface CircleParams extends ShapeParams {
  radius: number
}

export default class Circle<
  P extends CircleParams = CircleParams
> extends Shape<P> {
  radius: number

  get width() {
    return 2 * this.radius
  }

  get height() {
    return 2 * this.radius
  }

  constructor(params: P) {
    super(params)

    this.radius = params.radius

    if (this.radius <= 0)
      throw new GeometryError(`Circle radius ${this.radius} invalid`)
  }

  doPath(ctx: CanvasRenderingContext2D) {
    const {x, y, radius} = this
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
  }

  contains = (point: Pointed) => {
    return euclideanDistance(this, point) <= this.radius
  }
}
