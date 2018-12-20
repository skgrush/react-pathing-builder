import {MouseEvent, ReactNode} from 'react'

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

export interface StateButtonBoxProps {
  onClickUndo: (e?: MouseEvent) => void
  onClickRedo: (e?: MouseEvent) => void
  undoCount: number
  redoCount: number
}
