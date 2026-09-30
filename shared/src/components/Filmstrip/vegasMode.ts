// Vegas mode: every thumbnail with a filmstrip plays on its own, all at once.
//
// Enabled by adding `?vegas` (or `?vegas=1`) to the URL, disabled by `?vegas=0`.
// The choice is kept for the browser tab, so it survives navigation within the app.

const URL_PARAM = 'vegas'
const STORAGE_KEY = 'filmstrip.vegas'

// frames per second of the autoplay
const VEGAS_FPS = 8

export const isVegasMode = (): boolean => {
  try {
    const value = new URLSearchParams(window.location.search).get(URL_PARAM)
    if (value !== null) {
      const enabled = !['0', 'false', 'off'].includes(value.toLowerCase())
      sessionStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
      return enabled
    }
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// One timer drives all playing filmstrips, so their updates are batched into a single render
const listeners = new Set<(tick: number) => void>()
let timer: number | undefined
let tick = 0

export const subscribeVegasTick = (listener: (tick: number) => void) => {
  listeners.add(listener)
  if (timer === undefined) {
    timer = window.setInterval(() => {
      tick += 1
      listeners.forEach((callback) => callback(tick))
    }, 1000 / VEGAS_FPS)
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      window.clearInterval(timer)
      timer = undefined
    }
  }
}

/** Frame offset of a filmstrip, so thumbnails don't all show the same frame */
export const getVegasOffset = (src: string, frames: number) => {
  let hash = 0
  for (let i = 0; i < src.length; i++) hash = (hash * 31 + src.charCodeAt(i)) | 0
  return Math.abs(hash) % frames
}
