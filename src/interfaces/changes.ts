import {
  Change,
  ChangeAdd,
  ChangeRemove,
  ChangeMutateLoc,
  ChangeMutateEdge,
  ChangeGrab,
  ChangeDrop,
} from '../state/changes/Change'
import Location, {
  LocationMutablePropName,
  LocationMutablePropType,
} from '../state/Location'
import Edge, {EdgeMutablePropName, EdgeMutablePropType} from '../state/Edge'
import {Pointed} from './geometry'

/**
 * @module changes/interfaces
 * Purely-virtual interfaces for Change-related things
 */

export type ActionType =
  | 'add'
  | 'remove'
  | 'mutate-loc'
  | 'mutate-edge'
  | 'grab'
  | 'drop'

/** Union of Change-like interfaces. */
export type ChangeLike =
  | ChangeAddLike
  | ChangeRemoveLike
  | ChangeMutateLocLike
  | ChangeMutateEdgeLike
  | ChangeGrabLike
  | ChangeDropLike

/** Union of Change Classes. */
export type ChangeInstance =
  | ChangeAdd
  | ChangeRemove
  | ChangeMutateLoc
  | ChangeMutateEdge
  | ChangeGrab
  | ChangeDrop

export interface ChangeSubclass<CLS extends Change = Change> {
  new (...args: [CLS, ...any[]]): CLS
}

export interface ChangeAddLike {
  action: 'add'
  timestamp: number
  target: Location | Edge
  property?: undefined
  oldValue?: undefined
  newValue?: undefined
}

export interface ChangeRemoveLike {
  action: 'remove'
  timestamp: number
  target: Location | Edge
  property?: undefined
  oldValue?: undefined
  newValue?: undefined
}

export interface ChangeMutateLocLike {
  action: 'mutate-loc'
  timestamp: number
  target: Location
  property: LocationMutablePropName
  oldValue: LocationMutablePropType
  newValue: LocationMutablePropType
}

export interface ChangeMutateEdgeLike {
  action: 'mutate-edge'
  timestamp: number
  target: Edge
  property: EdgeMutablePropName
  oldValue: EdgeMutablePropType
  newValue: EdgeMutablePropType
}

export interface ChangeGrabLike {
  action: 'grab'
  timestamp: number
  target: Location
  property?: undefined
  oldValue: Pointed
  newValue?: undefined
}

export interface ChangeDropLike {
  action: 'drop'
  timestamp: number
  target: Location
  property?: undefined
  oldValue?: undefined
  newValue: Pointed
}
