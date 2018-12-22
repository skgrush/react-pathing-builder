import {Shape, Circle} from '../drawables'
import CanvasStore from './CanvasStore'

export interface ShapeC<T> {
  new (...args: any[]): T
}

export interface LocationLike {
  name: string | number
  x: string | number
  y: string | number
  data?: any

  neighborNames: Array<string | number>
}

export type LocationMutablePropName = 'name' | 'shape'
export type LocationMutablePropType = string | Shape

export default class Location<T extends Shape = Shape> implements LocationLike {
  name: string
  private _x: number
  private _y: number
  readonly store: CanvasStore
  readonly data: LocationLike & any
  readonly neighborNames: string[]

  shape: T

  get x() {
    return this._x
  }
  set x(val: number) {
    this._x = val
    this.shape.moveTo(val, this._y)
  }

  get y() {
    return this._y
  }
  set y(val: number) {
    this._y = val
    this.shape.moveTo(this._x, val)
  }

  constructor(
    data: LocationLike,
    store: CanvasStore,
    shapeType?: ShapeC<T>,
    shapeArgs?: object
  ) {
    this.name = String(data.name)
    this._x = +data.x
    this._y = +data.y
    this.store = store
    this.data = data

    this.neighborNames = data.neighborNames
      ? data.neighborNames.map(String)
      : []

    if (shapeType) {
      console.info('Have shapeType:', shapeType)
      this.shape = new shapeType(
        Object.assign(
          {
            x: this.x,
            y: this.y,
          },
          shapeArgs
        )
      )
    } else {
      const tmpShape = this.updateShape()
      console.info('No shapeType:', tmpShape)
      if (tmpShape) this.shape = tmpShape
      else
        this.shape = (new Circle({
          radius: 5,
          x: this.x,
          y: this.y,
        }) as unknown) as T
    }
  }

  updateStyle = () => {
    const style = this.store.locStyleGetter(this)
    if (style.hasOwnProperty('fill')) {
      this.shape.fill = style.fill || undefined
    }
    if (style.hasOwnProperty('stroke')) {
      this.shape.stroke = style.stroke || undefined
    }
    if (style.strokeWidth) {
      this.shape.strokeWidth = style.strokeWidth > 0 ? style.strokeWidth : 1
    }
  }

  updateShape = () => {
    const [shapeClass, opts] = this.store.locShapeGetter(this)
    console.info('updateShape:', shapeClass, opts)

    if (this.shape instanceof shapeClass) return false
    if (!shapeClass) {
      console.warn(`Received ${shapeClass} from locShapeGetter()`)
      return false
    }

    this.shape = new shapeClass(
      Object.assign({}, opts, {x: this.x, y: this.y})
    ) as T
    this.updateStyle()
    return this.shape
  }
}
