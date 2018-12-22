export * from './Drawable'
export * from './Connection'
export * from './Shape'
export * from './Circle'
export * from './Label'
export * from './Rectangle'
export * from './Square'
export * from './Star'

import Drawable from './Drawable'
import Connection from './Connection'
import Shape, {ShapeParams} from './Shape'
import Circle from './Circle'
import Label from './Label'
import Rectangle from './Rectangle'
import Square from './Square'
import Star from './Star'

export {Drawable, Connection, Shape, Circle, Label, Rectangle, Square, Star}

export interface ShapeSubclass<
  P extends ShapeParams,
  S extends Shape<P> = Shape<P>
> {
  new (...args: [P, ...any[]]): S
}

type IShapeMap = {
  //['Shape']: typeof Shape
  ['Circle']: typeof Circle
  ['Rectangle']: typeof Rectangle
  ['Square']: typeof Square
  ['Star']: typeof Star
  [index: string]: ShapeSubclass<any> | undefined
}

export const ShapeMap: IShapeMap = {
  //Shape,
  Circle,
  Rectangle,
  Square,
  Star,
}
