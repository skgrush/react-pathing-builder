import Location from './Location'
import CanvasStore from './CanvasStore'
import {Connection} from '../drawables'
import {EdgeExport} from '../interfaces'

export type EdgeMutablePropName = 'weight'
export type EdgeMutablePropType = number

export interface EdgeLike {
  start: string | number // Location key
  end: string | number // Location key
  weight?: number
}

export interface EdgeMutable {
  weight?: number
}

export function getEdgeKey(start: Location, end: Location) {
  return [start.key, end.key].sort().join('\t')
}

export function isEdgeLike(data: any): data is EdgeLike {
  if (!data) return false
  const startT = typeof data.start
  if (!data.start || (startT !== 'string' && startT !== 'number')) return false
  const endT = typeof data.end
  if (!data.end || (endT !== 'string' && endT !== 'number')) return false
  if (data.hasOwnProperty('weight')) {
    const weightT = typeof data.weight
    return weightT === 'number' || weightT === 'undefined'
  }
  return true
}

export default class Edge {
  readonly start: Location
  readonly end: Location
  readonly key: string
  readonly store: CanvasStore
  readonly connection: Connection
  private _weight: number

  constructor(s: Location, e: Location, store: CanvasStore, weight?: number) {
    this.start = s
    this.end = e
    this.key = getEdgeKey(this.start, this.end)
    this.store = store
    this._weight = weight && weight > 0 ? weight : 1
    this.connection = new Connection({
      start: s.shape,
      end: e.shape,
      strokeWidth: this._weight * store.weightScale,
    })
  }

  get weight() {
    return this._weight
  }

  set weight(val: number) {
    this._weight = val > 0 ? val : 1
    this.connection.strokeWidth = this._weight * this.store.weightScale
  }

  toObject(): EdgeExport {
    return {
      type: 'Edge',
      key: this.key,
      start: this.start.key,
      end: this.end.key,
      weight: this._weight,
    }
  }

  toString() {
    return `[Edge ${JSON.stringify(this.key)}]`
  }
}
