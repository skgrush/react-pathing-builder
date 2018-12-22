import Drawable, {DrawableParams} from './Drawable'

export interface PathDrawableParams extends DrawableParams {}

export default abstract class PathDrawable<
  P extends PathDrawableParams = PathDrawableParams
> extends Drawable {
  // x: number
  // y: number
  // fill?: CanvasStyleType
  // stroke?: CanvasStyleType
  // strokeWidth: number

  constructor(params: P) {
    super(params)
  }

  /**
   * @abstract drawPath(ctx)
   * Should generate a new path in the canvas context, preparing it for drawing.
   */
  abstract doPath(ctx: CanvasRenderingContext2D): void

  /**
   * Generic draw function for any shape.
   */
  draw(ctx: CanvasRenderingContext2D) {
    this.doPath(ctx)

    if (this.fill) {
      ctx.fillStyle = this.fill
      ctx.fill()
    }
    if (this.stroke && this.strokeWidth > 0) {
      ctx.strokeStyle = this.stroke
      ctx.lineWidth = this.strokeWidth
      ctx.stroke()
    }
  }
}
