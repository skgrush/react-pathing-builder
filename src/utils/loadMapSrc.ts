/**
 * Try to load an image asynchronously.
 * Returns when the image is done loading, or on failure.
 * Always returns a NEW HTMLImageElement or null.
 */
export async function loadMapSrc(mapSrc: HTMLImageElement | string) {
  if (mapSrc instanceof HTMLImageElement) {
    if (mapSrc.complete && (!mapSrc.width || !mapSrc.height)) {
      console.debug('Bad Image passed to loadMapSrc')
      return null
    }
    if (mapSrc.complete) {
      console.debug('mapSrc already loaded')
    } else {
      console.debug('Need to wait on mapSrc')
      const mapSrcImg = mapSrc
      // wait for mapSrc to load
      const result = await new Promise<ErrorEvent | Event>(resolve => {
        const cb = (e: ErrorEvent | Event) => {
          mapSrcImg.removeEventListener('load', cb)
          mapSrcImg.removeEventListener('error', cb)
          resolve(e)
        }
        mapSrcImg.addEventListener('load', cb, {passive: true})
        mapSrcImg.addEventListener('error', cb, {passive: true})
        console.debug('Waiting on mapSrc HTMLImageElement to load...')
      })

      if (result.type === 'error') {
        console.debug('mapSrc failed to load')
        return null
      }
    }
    mapSrc = mapSrc.src
  }
  if (typeof mapSrc !== 'string') {
    console.error(
      'Bad argument to loadMapSrc, not a string or HTMLImageElement',
      mapSrc
    )
    return null
  }

  if (!mapSrc.length) {
    // No image content, so nothing to wait for
    return null
  }

  console.debug('Awaiting image load')
  const img = new Image()
  const event: any = await new Promise(resolve => {
    img.onerror = img.onload = (e: any) => resolve(e)
    img.src = mapSrc as string
  })

  return event.type === 'load' ? img : null
}
