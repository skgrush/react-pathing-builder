import PathDrawable, {PathDrawableParams} from '../PathDrawable'

export interface ShapeParams extends PathDrawableParams {}

export default abstract class Shape<
  T extends ShapeParams = ShapeParams
> extends PathDrawable {
  // x: number
  // y: number
  // fill?: string
  // lineWidth?: number

  constructor(params: T) {
    super(params)
  }
}
