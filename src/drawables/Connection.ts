import Drawable from './Drawable'

export interface ConnectionParams {
  start: Drawable
  end: Drawable
  stroke?: string | CanvasGradient | CanvasPattern
  strokeWidth?: number
}

export default class Connection extends Drawable {
  readonly start: Drawable
  readonly end: Drawable
  stroke: string | CanvasGradient | CanvasPattern = '#FFF'
  strokeWidth: number = 1

  get width() {
    return Math.abs(this.start.x - this.end.x)
  }

  get height() {
    return Math.abs(this.start.y - this.end.y)
  }

  get length() {
    return Math.sqrt(this.width ** 2 + this.height ** 2)
  }

  constructor(params: ConnectionParams) {
    super(
      Object.assign(
        {
          x: Math.abs(params.start.x - params.end.x) / 2,
          y: Math.abs(params.start.y - params.end.y) / 2,
        },
        params
      )
    )

    this.start = params.start
    this.end = params.end
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath()
    ctx.strokeStyle = this.stroke
    ctx.lineWidth = this.strokeWidth
    ctx.moveTo(this.start.x, this.start.y)
    ctx.lineTo(this.end.x, this.end.y)
  }
}
