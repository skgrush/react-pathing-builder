import {Pointed} from '../interfaces'

export function numAvg(a: number, b: number) {
  return (a + b) / 2
}

/**
 * Find the sum of two points and assign it to a third (optional) point.
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
