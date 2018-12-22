import * as React from 'react'

import {StylableParams, LabelStyleParams} from './geometry'
import Location, {LocationLike} from '../state/Location'
import {Shape, ShapeParams, ShapeSubclass} from '../drawables'

export interface PropertiesPanelProps {}

export interface StateButtonBoxProps {
  onClickUndo: (e?: React.MouseEvent) => void
  onClickRedo: (e?: React.MouseEvent) => void
  undoCount: number
  redoCount: number
}

export type LabelStyler = (loc: Location) => LabelStyleParams
export type LocationStyler = (loc: Location) => StylableParams
export type LocationShaper = <P extends ShapeParams>(
  loc: Location<Shape<P>> | LocationLike & P
) => [ShapeSubclass<any>, P]
