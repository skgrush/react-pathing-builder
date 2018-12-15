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
