import {Pointed} from './geometry'
import {
  LocationMutablePropName,
  LocationMutablePropType,
} from '../state/Location'
import {EdgeMutablePropName, EdgeMutablePropType} from '../state/Edge'

export interface MoveExport {
  type: 'move'
  target: string // key
  oldValue?: Pointed
  newValue: Pointed
}

export interface ModExport {
  type: 'mod'
  target: string // key
  property: LocationMutablePropName | EdgeMutablePropName
  oldValue: LocationMutablePropType | EdgeMutablePropType
  newValue: LocationMutablePropType | EdgeMutablePropType
}

export interface LocationExport {
  type: 'Location'
  key: string
  name: string
  x: number
  y: number
  shape: string // shape name
  data: any
  neighborKeys: Array<string> // array of Location keys

  ['key']: string
  ['name']: string
  ['x']: number
  ['y']: number
  ['shape']: string
}

export interface EdgeExport {
  type: 'Edge'
  key: string
  start: string
  end: string
  weight: number

  ['key']: string
  ['start']: string
  ['end']: string
  ['weight']: number
}

export type ObjectExport = LocationExport | EdgeExport

export interface ExportStruct {
  added: ObjectExport[]
  removed: ObjectExport[]
  modded: ModExport[]
  moved: MoveExport[]
}

export interface ExportSimple {
  locations: LocationExport[]
  edges: EdgeExport[]
}
