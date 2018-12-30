import Location from './Location'
import CanvasStore from './CanvasStore'
import {Connection} from '../drawables'

export type EdgeMutablePropName = 'weight'
export type EdgeMutablePropType = number

export interface EdgeMutable {
  weight?: number
}

export function getEdgeKey(start: Location, end: Location) {
  return [start.key, end.key].sort().join('\t')
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
}
