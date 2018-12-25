import Drawable from './Drawable'
import PathDrawable from './PathDrawable'
import {CanvasStyleType, Pointed} from '../interfaces'
import {
  numAvg,
  midPointed,
  euclideanDistance,
  perpendicularDistance,
} from '../utils'

export interface ConnectionParams {
  start: Drawable
  end: Drawable
  stroke?: CanvasStyleType
  strokeWidth?: number
}

export default class Connection extends PathDrawable {
  start: Drawable
  end: Drawable
  stroke: CanvasStyleType = '#000'
  strokeWidth: number = 3

  get x() {
    return numAvg(this.start.x, this.end.x)
  }

  get y() {
    return numAvg(this.start.y, this.end.y)
  }

  get width() {
    return Math.abs(this.start.x - this.end.x)
  }

  get height() {
    return Math.abs(this.start.y - this.end.y)
  }

  get length() {
    return euclideanDistance(this.start, this.end)
  }

  constructor(params: ConnectionParams) {
    super(Object.assign(midPointed(params.start, params.end), params))

    this.start = params.start
    this.end = params.end
  }

  doPath(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.moveTo(this.start.x, this.start.y)
    ctx.lineTo(this.end.x, this.end.y)
  }

  /**
   * Calculate if a point lies within the VISIBLE bounds of the Connection.
   *
   * Connection containment checking differs from normal Drawable calculation;
   * we need to take into account the strokeWidth as the width. The imperfect
   * heuristic checks if (1) the point is within the conventional
   * bounding box and (2) if the perpendicular distance is less than the
   * stroke width. There are no false positives, but there are small regions
   * of false negatives outside the bounding box at the vertices.
   */
  contains(point: Pointed) {
    return (
      Drawable.prototype.contains.call(this, point) &&
      perpendicularDistance(this.start, this.end, point) < this.strokeWidth / 2
    )
  }
}
