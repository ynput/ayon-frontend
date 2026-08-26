import { useEffect, useState } from 'react'

export type ImageStatus = 'loading' | 'loaded' | 'error'

// a missing thumbnail 404s and 404s are not http cached, so remember the outcome per url.
// urls carry a thumbnail hash, so uploading a thumbnail produces a new url and misses this cache.
const resolved = new Map<string, Exclude<ImageStatus, 'loading'>>()

const getResolved = (src?: string | null) => (src ? resolved.get(src) : 'error')

// preloads off-DOM so a missing image never flashes the browser's broken-image icon
export const useImageStatus = (src?: string | null): ImageStatus => {
  const [status, setStatus] = useState<ImageStatus>(() => getResolved(src) || 'loading')

  useEffect(() => {
    const known = getResolved(src)
    if (known) {
      setStatus(known)
      return
    }

    let cancelled = false
    const url = src as string

    const resolve = (next: Exclude<ImageStatus, 'loading'>) => {
      resolved.set(url, next)
      if (!cancelled) setStatus(next)
    }

    const image = new Image()
    image.src = url

    if (image.complete) {
      resolve(image.naturalWidth ? 'loaded' : 'error')
      return
    }

    setStatus('loading')
    image.onload = () => resolve('loaded')
    image.onerror = () => resolve('error')

    return () => {
      cancelled = true
    }
  }, [src])

  return status
}
