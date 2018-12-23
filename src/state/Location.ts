import {Label, Shape, Circle, ShapeMap} from '../drawables'
import {CanvasStyleType, Pointed} from '../interfaces'
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
export type LocationMutablePropType = string

export interface LocationMutableProps {
  name?: string
  x?: number
  y?: number
  shape?: string
}

export default class Location<T extends Shape = Shape> implements LocationLike {
  private _name: string
  private _x: number
  private _y: number
  readonly store: CanvasStore
  readonly data: LocationLike & any
  readonly neighborNames: string[]

  shape: T
  label: Label

  get name() {
    return this._name
  }

  set name(val: string) {
    this._name = String(val)
    if (this.label) this.label.text = this._name
  }

  get x() {
    return this._x
  }
  set x(val: number) {
    this._x = val
    this.shape.moveTo(val, this._y)
    this.label.moveTo(val, this._y)
  }

  get y() {
    return this._y
  }
  set y(val: number) {
    this._y = val
    this.shape.moveTo(this._x, val)
    this.label.moveTo(this._x, val)
  }

  constructor(
    data: LocationLike,
    store: CanvasStore,
    shapeType?: ShapeC<T>,
    shapeArgs?: object
  ) {
    this._name = String(data.name)
    this._x = +data.x
    this._y = +data.y
    this.store = store
    this.data = data

    this.neighborNames = data.neighborNames
      ? data.neighborNames.map(String)
      : []

    this.label = new Label({
      text: this._name,
      x: this.x,
      y: this.y,
      ...this.store.labelStyleGetter(this),
    })

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

    this.label.offset = this.calculateLabelOffset()
  }

  moveTo = (P: Pointed) => {
    this._x = P.x
    this._y = P.y
    this.shape.moveTo(this._x, this._y)
    this.label.moveTo(this._x, this._y)
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

    if (this.label) {
      const fontStyle = this.store.labelStyleGetter(this)
      for (const p of ['font', 'fill', 'stroke', 'strokeWidth']) {
        if (fontStyle.hasOwnProperty(p)) {
          ;(this.label as any)[p] = (fontStyle as any)[p]
        }
      }
      this.label.offset = this.calculateLabelOffset()
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

  private calculateLabelOffset() {
    let x = 0,
      y = 0
    if (this.shape) {
      x += this.shape.width / 2
      y += this.shape.height / 2

      if (this.label && this.label.width) {
        x += this.label.width / 4
        y += this.label.height / 2
      }
    }
    return {x, y}
  }

  draw = (ctx: CanvasRenderingContext2D, selectStyle?: CanvasStyleType) => {
    // calc label dimensions if we haven't already
    if (!this.label.width || !this.label.height) {
      this.label._calcDimensions(ctx)
      this.label.offset = this.calculateLabelOffset()
    }

    if (!selectStyle) {
      this.shape.draw(ctx)
      this.label.draw(ctx)
    } else {
      // backup values
      const {stroke, strokeWidth} = this.shape

      this.shape.stroke = selectStyle
      this.shape.strokeWidth = 2
      try {
        // draw it
        this.shape.draw(ctx)
        this.label.draw(ctx, selectStyle)
      } finally {
        // reset style
        Object.assign(this.shape, {stroke, strokeWidth})
      }
    }
  }
}
