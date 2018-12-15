import Shape, {ShapeParams} from './Shape'
import {GeometryError} from '../errors'

export interface RectangleParams extends ShapeParams {
  width: number
  height: number
}

export default class Rectangle extends Shape {
  _width: number
  _height: number

  get width() {
    return this._width
  }
  get height() {
    return this._height
  }

  constructor(params: RectangleParams) {
    super(params)
    this._width = params.width
    this._height = params.height

    if (this._width <= 0)
      throw new GeometryError(`Rectangle width of ${this._width} invalid`)
    if (this._height <= 0)
      throw new GeometryError(`Rectangle height of ${this._height} invalid`)
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    const {x, y, width, height, fill, stroke, strokeWidth} = this
    if (fill) {
      ctx.fillStyle = fill
      ctx.fillRect(x - width / 2, y - height / 2, width, height)
    }
    if (stroke && strokeWidth > 0) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = strokeWidth
      ctx.strokeRect(x, y, width, height)
    }
  }
}
