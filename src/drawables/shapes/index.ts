export * from './Circle'
export * from './Rectangle'
export * from './Shape'
export * from './Square'
export * from './Star'
export * from './Triangle'

import Circle from './Circle'
import Rectangle from './Rectangle'
import Shape, {ShapeParams} from './Shape'
import Square from './Square'
import Star from './Star'
import Triangle from './Triangle'

export {Circle, Rectangle, Shape, Square, Star}

/** Shape-related helpers */

export interface ShapeSubclass<
  P extends ShapeParams,
  S extends Shape<P> = Shape<P>
> {
  new (...args: [P, ...any[]]): S
}

export type ShapeMap = {
  //['Shape']: typeof Shape
  ['Circle']: typeof Circle
  ['Rectangle']: typeof Rectangle
  ['Square']: typeof Square
  ['Star']: typeof Star
  ['Triangle']: typeof Triangle
  [index: string]: ShapeSubclass<any> | undefined
}

export const ShapeMap: ShapeMap = {
  //Shape,
  Circle,
  Rectangle,
  Square,
  Star,
  Triangle,
}

export const ShapeSymbolMap: {[i: string]: string} = {
  Circle: '●', // '\u25CF', // BLACK CIRCLE
  Rectangle: '█', // '\u2588', // FULL BLOCK
  Square: '■', // '\u25A0', // BLACK SQUARE
  Star: '★', // '\u2605', // BLACK STAR
  Triangle: '▲', // '\u25B2', // BLACK UP-POINTING TRIANGLE
}
