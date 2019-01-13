import {DimensionBox} from '../interfaces'

interface ScaledDimensionBox extends DimensionBox {
  scaleRatio: number
}

/**
 * Takes an inner and outer box as arguments, and returns a box scaled to fit
 * in outer with the aspect ratio of inner.
 */
export function fitBoxInBox(
  inner: DimensionBox,
  outer: Partial<DimensionBox>
): ScaledDimensionBox {
  let {width, height} = inner
  const outerWidth = outer.width || Infinity
  const outerHeight = outer.height || Infinity

  const scaleRatio = Math.min(outerWidth / width, outerHeight / height)
  width *= scaleRatio
  height *= scaleRatio
  return {width, height, scaleRatio}
}
