import {DimensionBox} from '../interfaces'

type Corner = TOP_LEFT | TOP_RIGHT | BOTTOM_RIGHT | BOTTOM_LEFT

type TOP = 1
type BOTTOM = 2
type RIGHT = 4
type LEFT = 8
type TOP_RIGHT = 5
type BOTTOM_RIGHT = 6
type TOP_LEFT = 9
type BOTTOM_LEFT = 10

const TOP = 1
const BOTTOM = 2
const RIGHT = 4
const LEFT = 8
const TOP_RIGHT = (TOP | RIGHT) as TOP_RIGHT
const BOTTOM_RIGHT = (BOTTOM | RIGHT) as BOTTOM_RIGHT
const TOP_LEFT = (TOP | LEFT) as TOP_LEFT
const BOTTOM_LEFT = (BOTTOM | LEFT) as BOTTOM_LEFT

export {Corner, TOP_RIGHT, TOP_LEFT, BOTTOM_RIGHT, BOTTOM_LEFT}

/**
 * Draw a text string in the corner of the canvas.
 */
export function drawCornerText(
  txt: string,
  ctx: CanvasRenderingContext2D,
  {height, width}: DimensionBox,
  scaleRatio: number,
  where: Corner = BOTTOM_LEFT,
  baseFontSize = 10
) {
  const fontSize = Math.ceil(baseFontSize / scaleRatio)

  // backup styles
  const {font, fillStyle, strokeStyle, lineWidth, textAlign, textBaseline} = ctx

  // change styles
  ctx.font = `${fontSize}px Courier New`
  ctx.strokeStyle = 'white'
  ctx.lineWidth = Math.ceil(2 / scaleRatio)
  ctx.fillStyle = 'black'

  // determine where to draw the text based on the `where` value.
  ctx.textAlign = where & RIGHT ? 'right' : 'left'
  ctx.textBaseline = where & TOP ? 'top' : 'bottom'

  // X,Y is the coordinate pair of the specified corner.
  const X = where & RIGHT ? width : 0
  const Y = where & TOP ? 0 : height

  // the width/height to clear, relative to the corner's X,Y
  const clearW = (where & RIGHT ? -1 : 1) * txt.length * (fontSize / 1.5)
  const clearH = where & TOP ? fontSize : -fontSize - 1

  ctx.clearRect(X, Y, clearW, clearH)
  ctx.strokeText(txt, X, Y)
  ctx.fillText(txt, X, Y)

  // reset backed-up ctx variables
  Object.assign(ctx, {
    font,
    fillStyle,
    strokeStyle,
    lineWidth,
    textAlign,
    textBaseline,
  })

  return true
}
