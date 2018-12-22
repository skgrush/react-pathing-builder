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

export interface LabelStyleParams extends StylableParams {
  font?: string
}
