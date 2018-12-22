import Drawable, {DrawableParams} from './Drawable'

export interface ShapeParams extends DrawableParams {}

export default abstract class Shape<
  T extends ShapeParams = ShapeParams
> extends Drawable {
  // x: number
  // y: number
  // fill?: string
  // lineWidth?: number

  constructor(params: T) {
    super(params)
  }
}
