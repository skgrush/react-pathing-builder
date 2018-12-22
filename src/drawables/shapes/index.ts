export * from './Circle'
export * from './Rectangle'
export * from './Shape'
export * from './Square'
export * from './Star'

import Circle from './Circle'
import Rectangle from './Rectangle'
import Shape, {ShapeParams} from './Shape'
import Square from './Square'
import Star from './Star'

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
  [index: string]: ShapeSubclass<any> | undefined
}

export const ShapeMap: ShapeMap = {
  //Shape,
  Circle,
  Rectangle,
  Square,
  Star,
}
