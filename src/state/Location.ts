import Shape from '../drawables/Shape'

export interface ShapeC<T> {
  new (...args: any[]): T
}

export interface LocationLike {
  name: string | number
  x: string | number
  y: string | number

  neighborNames: Array<string | number>
}

export type LocationMutablePropName = 'name' | 'shape'
export type LocationMutablePropType = string | Shape

export default class Location<T extends Shape = Shape> implements LocationLike {
  name: string
  private _x: number
  private _y: number
  data: LocationLike
  neighborNames: string[]

  shape: T

  get x() {
    return this._x
  }
  set x(val: number) {
    this._x = val
    this._updateShape()
  }

  get y() {
    return this._y
  }
  set y(val: number) {
    this._y = val
    this._updateShape()
  }

  constructor(data: LocationLike, shapeType: ShapeC<T>, shapeArgs?: object) {
    this.name = String(data.name)
    this._x = +data.x
    this._y = +data.y
    this.data = data

    this.neighborNames = data.neighborNames
      ? data.neighborNames.map(String)
      : []
    this.shape = new shapeType(
      Object.assign(
        {
          x: this.x,
          y: this.y,
        },
        shapeArgs
      )
    )
  }

  _updateShape = () => {
    this.shape.moveTo(this.x, this.y)
  }
}
