import Shape, {ShapeParams} from './Shape'
import {GeometryError} from '../../errors'

const ROTATION_FACTOR = (2 * Math.PI) / 3
const ROTATION_OFFSET = Math.PI
const SQRT_THREE = Math.sqrt(3)

export interface TriangleParams extends ShapeParams {
  radius: number
}

export default class Triangle extends Shape<TriangleParams> {
  radius: number

  get width() {
    return SQRT_THREE * this.radius
  }

  get height() {
    return (3 * this.radius) / 2
  }

  constructor(params: TriangleParams) {
    super(params)
    this.radius = params.radius

    if (this.radius <= 0)
      throw new GeometryError(`Triangle radius ${this.radius} invalid`)
  }

  doPath(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    for (let i = 3; i > 0; i--) {
      const omega = ROTATION_FACTOR * i + ROTATION_OFFSET
      ctx.lineTo(
        this.radius * Math.sin(omega) + this.x,
        this.radius * Math.cos(omega) + this.y
      )
    }
    ctx.closePath()
  }
}
