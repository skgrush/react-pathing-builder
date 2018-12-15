import Shape, {ShapeParams} from './Shape'
import {GeometryError} from '../errors'
import {Pointed} from '../interfaces'

export interface CircleParams extends ShapeParams {
  radius: number
}

export default class Circle extends Shape {
  radius: number

  get width() {
    return 2 * this.radius
  }

  get height() {
    return 2 * this.radius
  }

  constructor(params: CircleParams) {
    super(params)

    this.radius = params.radius

    if (this.radius <= 0)
      throw new GeometryError(`Circle radius ${this.radius} invalid`)
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    const {x, y, radius, fill, stroke, strokeWidth} = this
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke && strokeWidth > 0) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = strokeWidth
      ctx.stroke()
    }
  }

  contains = ({x, y}: Pointed) => {
    return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2) <= this.radius
  }
}
