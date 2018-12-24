import * as React from 'react'

import {StylableParams, LabelStyleParams} from './geometry'
import Location, {LocationLike, LocationMutableProps} from '../state/Location'
import Edge, {EdgeMutable} from '../state/Edge'
import {Shape, ShapeParams, ShapeSubclass} from '../drawables'

export interface PropertiesPanelProps {
  selected: Readonly<Location | Edge | null>
  modifyLocation: (
    loc: Readonly<Location>,
    diff: LocationMutableProps
  ) => boolean
  modifyEdge: (edge: Readonly<Edge>, diff: EdgeMutable) => boolean
}

export interface StateButtonBoxProps {
  /** handler for request an undo in the canvas and change stores */
  onClickUndo: (e?: React.MouseEvent) => void
  /** handler for request a redo in the canvas and change stores */
  onClickRedo: (e?: React.MouseEvent) => void
  undoCount: number
  redoCount: number
}

export type LabelStyler = (loc: Location) => LabelStyleParams
export type LocationStyler = (loc: Location) => StylableParams
export type LocationShaper = <P extends ShapeParams>(
  loc: Location<Shape<P>> | LocationLike & P
) => [ShapeSubclass<any>, P]