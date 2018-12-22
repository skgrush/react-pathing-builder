import {CanvasStyleType, Pointed} from '../interfaces'
import Drawable, {DrawableParams} from './Drawable'
import {addPointed} from '../utils'

export interface LabelParams extends DrawableParams {
  text: string
  font?: string
  offset?: Pointed
  ['text']: string
}

export default class Label<
  P extends LabelParams = LabelParams
> extends Drawable {
  text: string
  strokeWidth: number
  font?: string
  /** {x,y} offset from the labeled shape to the label */
  offset: Pointed

  private _width: number = 0
  private _height: number = 0

  get width() {
    return this._width
  }

  get height() {
    return this._height
  }

  constructor(params: P) {
    super(params)

    this.text = params.text
    this.strokeWidth = params.strokeWidth || 0
    this.font = params.font || undefined
    this.offset = params.offset || {x: 0, y: 0}
  }

  draw = (ctx: CanvasRenderingContext2D, selectStyle?: CanvasStyleType) => {
    // backup current ctx variables
    const {font, fillStyle, strokeStyle, lineWidth} = ctx

    // get our effective x and y based on offset
    const {x, y} = addPointed(this, this.offset)
    const myFill = selectStyle || this.fill

    if (this.font) ctx.font = this.font

    if (myFill) {
      ctx.fillStyle = myFill
      ctx.fillText(this.text, x, y)
      ctx.fillStyle = fillStyle
    }
    if (this.stroke && this.strokeWidth > 0) {
      ctx.strokeStyle = this.stroke
      ctx.lineWidth = this.strokeWidth
      ctx.strokeText(this.text, x, y)
      ctx.strokeStyle = strokeStyle
      ctx.lineWidth = lineWidth
    }

    ctx.font = font
  }

  _calcDimensions(ctx: CanvasRenderingContext2D) {
    const OLD_FONT = ctx.font
    if (this.font) ctx.font = this.font
    const {width, emHeightAscent, emHeightDescent} = ctx.measureText(this.text)
    this._width = width
    this._height = emHeightAscent + emHeightDescent
    if (this.font) ctx.font = OLD_FONT
  }
}
