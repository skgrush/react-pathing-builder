import {ShapeParams} from './Shape'
import Rectangle, {RectangleParams} from './Rectangle'

export interface SquareParams extends ShapeParams {
  sidelength: number
}

export default class Square extends Rectangle {
  sidelength: number

  constructor(params: SquareParams) {
    const {sidelength} = params
    super(Object.assign({width: sidelength, height: sidelength}, params))

    this.sidelength = sidelength
  }
}
