import {MouseEvent, ReactNode} from 'react'
import Location, {LocationLike} from '../state/Location'
import {Shape, ShapeParams, ShapeSubclass} from '../drawables'

export interface DimensionBox {
  width: number
  height: number
}

export interface Pointed {
  x: number
  y: number
}

export interface LocatedBox extends DimensionBox, Pointed {}

export type CanvasStyleType = string | CanvasGradient | CanvasPattern

/** parameters associated with all Drawables' styles. */
export interface StylableParams {
  fill?: CanvasStyleType
  stroke?: CanvasStyleType
  strokeWidth?: number
}

export interface StateButtonBoxProps {
  onClickUndo: (e?: MouseEvent) => void
  onClickRedo: (e?: MouseEvent) => void
  undoCount: number
  redoCount: number
}

export type LocationStyler = (loc: Location) => StylableParams
export type LocationShaper = <P extends ShapeParams>(
  loc: Location<Shape<P>> | LocationLike & P
) => [ShapeSubclass<any>, P]
