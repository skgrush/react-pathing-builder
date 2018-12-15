import {DimensionBox} from '../interfaces'

/**
 * Takes an inner and outer box as arguments, and returns a box scaled to fit
 * in outer with the aspect ratio of inner.
 */
export function fitBoxInBox(
  inner: DimensionBox,
  outer: DimensionBox
): DimensionBox {
  let {width, height} = inner
  const scaleRatio = Math.min(outer.width / width, outer.height / height)
  width *= scaleRatio
  height *= scaleRatio
  return {width, height}
}
