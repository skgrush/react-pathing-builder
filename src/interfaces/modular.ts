import * as React from 'react'

import {StylableParams, LabelStyleParams, CanvasStyleType} from './geometry'
import Location, {LocationLike, LocationMutableProps} from '../state/Location'
import Edge, {EdgeMutable} from '../state/Edge'
import {Shape, ShapeParams, ShapeSubclass} from '../drawables'
import ChangeStore from '../state/changes/ChangeStore'
import CanvasStore from '../state/CanvasStore'

export type ModularComponentProp =
  | DataImporterProps
  | DataExporterProps
  | ChangesExporterProps
  | StateButtonBoxProps
  | PropertiesPanelProps
  | StyleSetterProps

export interface DataImporterProps {
  lastChange: ChangeStore['lastChange']
  importData: CanvasStore['loadData']
  space?: number
}

export interface StyleSetterProps {
  lastChange: ChangeStore['lastChange']
  styleUpdater: (arg: StyleUpdaterArg) => void
}

export interface BaseExporterProps {
  lastChange: object | null
  exportData: () => object
  space?: number
}

export interface DataExporterProps extends BaseExporterProps {
  exportData: CanvasStore['exportData']
}

export interface ChangesExporterProps extends BaseExporterProps {
  exportData: ChangeStore['exportChanges']
}

export interface PropertiesPanelProps {
  selected: Readonly<Location | Edge | null>
  modifyLocation: (
    loc: Readonly<Location>,
    diff: LocationMutableProps
  ) => boolean
  deleteLocation: (loc: Readonly<Location>) => boolean
  modifyEdge: (edge: Readonly<Edge>, diff: EdgeMutable) => boolean
  deleteEdge: (edge: Readonly<Edge>) => boolean
}

export interface StateButtonBoxProps {
  /** handler for request an undo in the canvas and change stores */
  onClickUndo: (e?: React.MouseEvent) => void
  /** handler for request a redo in the canvas and change stores */
  onClickRedo: (e?: React.MouseEvent) => void
  /** handler for request to clear the canvas/change stores. */
  onClickClear: (e?: React.MouseEvent) => void
  undoCount: number
  redoCount: number
  /** the canvas is empty */
  isEmpty: boolean
}

export type LabelStyler = (loc: Location) => LabelStyleParams
export type LocationStyler = (loc: Location) => StylableParams
export type LocationShaper = <P extends ShapeParams>(
  loc: Location<Shape<P>> | LocationLike & P
) => [ShapeSubclass<any>, P]

export interface StyleUpdaterArg {
  selectionStroke?: CanvasStyleType | null
  locStyleGetter?: LocationStyler | null
  locShapeGetter?: LocationShaper | null
  labelStyleGetter?: LabelStyler | null
}
