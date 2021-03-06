import {Pointed, DimensionBox} from '../interfaces'

export function numAvg(a: number, b: number) {
  return (a + b) / 2
}

/**
 * Find the sum of two points and assign it to a third (optional) point.
 *
 * @examples
 *    A - B    =>  diffPointed(A, B)
 *  C = A - B  =>  diffPointed(A, B, C)
 */
export function diffPointed(
  a: Pointed,
  b: Pointed,
  assignTo: Pointed = {} as any
): Pointed {
  return Object.assign(assignTo, {
    x: a.x - b.x,
    y: a.y - b.y,
  })
}

/**
 * Find the difference of two points and assign it to a third (optional) point.
 *
 * @examples
 *    A + B    =>  addPointed(A, B)
 *  C = A + B  =>  addPointed(A, B, C)
 */
export function addPointed(
  a: Pointed,
  b: Pointed,
  assignTo: Pointed = {} as any
): Pointed {
  return Object.assign(assignTo, {
    x: a.x + b.x,
    y: a.y + b.y,
  })
}

/**
 * Check if two points are at equal coordinates
 */
export function equalPointed(a: Pointed, b: Pointed) {
  return a.x === b.x && a.y === b.y
}

/**
 * Find the midpoint of two points and assign it to a third (optional) point.
 */
export function midPointed(
  a: Pointed,
  b: Pointed,
  assignTo: Pointed = {} as any
) {
  return Object.assign(assignTo, {
    x: numAvg(a.x, b.x),
    y: numAvg(a.y, b.y),
  })
}

/**
 * Dot product of Point-like x,y pairs.
 */
export function dotPointed(
  a: Pointed,
  b: Pointed,
  assignTo: Pointed = {} as any
) {
  return Object.assign(assignTo, {
    x: a.x * b.x,
    y: a.y * b.y,
  })
}

/**
 * Scalar multiplication of Point-like x,y pair.
 */
export function scalePointed(
  a: Pointed,
  scalar: number,
  assignTo: Pointed = {} as any,
  floor = false
) {
  if (floor)
    return Object.assign(assignTo, {
      x: Math.floor(scalar * a.x),
      y: Math.floor(scalar * a.y),
    })
  else
    return Object.assign(assignTo, {
      x: scalar * a.x,
      y: scalar * a.y,
    })
}

/**
 * Limit a Point-like x,y pair between (0,0) and a given pair.
 *
 * If `limited` exceeds the bounds, rewrite its values.
 */
export function boundPointed(target: Pointed, limit: DimensionBox | Pointed) {
  const {x, y} = PointedOrDimensionBox(limit)
  if (target.x < 0) target.x = 0
  else if (target.x > x) target.x = Math.floor(x)
  if (target.y < 0) target.y = 0
  else if (target.y > y) target.y = Math.floor(y)
}

/**
 * Distance calculation of a straight line.
 */
export function euclideanDistance(P: Pointed, Q: Pointed) {
  // find the coordinate-difference
  const val = diffPointed(P, Q)
  // square the differences
  dotPointed(val, val, val)
  // root-sum of square differences
  return Math.sqrt(val.x + val.y)
}

/**
 * Distance between a point `P` and a line defined by points `L1` and `L2`.
 */
export function perpendicularDistance(L1: Pointed, L2: Pointed, P: Pointed) {
  const Ldiff = diffPointed(L2, L1)
  return (
    Math.abs(Ldiff.y * P.x - Ldiff.x * P.y + L2.x * L1.y - L2.y * L1.x) /
    euclideanDistance(L2, L1)
  )
}

Object.assign(window, {
  perpendicularDistance,
})

/**
 * Discriminate between Pointed or DimensionBox. Convert to a Pointed.
 *
 * Tries to use `x` and `y` properties first, then `width` and `height`.
 */
export function PointedOrDimensionBox(thing: Pointed | DimensionBox): Pointed {
  const {x, y} = <Pointed>thing
  if (x !== undefined && y !== undefined) {
    return {x, y}
  }
  const {width, height} = <DimensionBox>thing
  return {
    x: width,
    y: height,
  }
}
