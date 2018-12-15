import Drawable, {DrawableParams} from './Drawable'

export interface ShapeParams extends DrawableParams {}

export default abstract class Shape extends Drawable {
  // x: number
  // y: number
  // fill?: string
  // lineWidth?: number

  constructor(params: ShapeParams) {
    super(params)
  }
}
