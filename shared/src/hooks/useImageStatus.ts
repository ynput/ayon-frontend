import { useEffect, useState } from 'react'

export type ImageStatus = 'loading' | 'loaded' | 'error'

// a missing thumbnail 404s and 404s are not http cached, so remember the outcome per url.
// urls carry a thumbnail hash, so uploading a thumbnail produces a new url and misses this cache.
const resolved = new Map<string, Exclude<ImageStatus, 'loading'>>()

const getResolved = (src?: string | null) => (src ? resolved.get(src) : 'error')

type Resolved = { src?: string | null; status: ImageStatus }

// preloads off-DOM so a missing image never flashes the browser's broken-image icon
export const useImageStatus = (src?: string | null): ImageStatus => {
  const [state, setState] = useState<Resolved>(() => ({
    src,
    status: getResolved(src) || 'loading',
  }))

  useEffect(() => {
    const known = getResolved(src)
    if (known) {
      setState({ src, status: known })
      return
    }

    let cancelled = false
    const url = src as string

    const resolve = (next: Exclude<ImageStatus, 'loading'>) => {
      resolved.set(url, next)
      if (!cancelled) setState({ src: url, status: next })
    }

    const image = new Image()
    image.src = url

    if (image.complete) {
      resolve(image.naturalWidth ? 'loaded' : 'error')
      return
    }

    setState({ src, status: 'loading' })
    image.onload = () => resolve('loaded')
    image.onerror = () => resolve('error')

    return () => {
      cancelled = true
    }
  }, [src])

  // the effect runs after paint, so never report a status that belongs to a previous url
  return state.src === src ? state.status : getResolved(src) || 'loading'
}
