// Loads and caches hover-scrub filmstrips.
//
// A filmstrip is a single image with `frames` video frames laid out in a grid of `columns`
// columns, left to right, top to bottom. The filmstrip endpoints return the layout and an URL
// of the image (served by the server for local storages, a signed URL for S3 storages).

export interface FilmstripData {
  fileId: string // the video file (reviewable) the frames were taken from
  url: string // URL of the filmstrip image, already decoded
  frames: number
  columns: number
  frameWidth: number
  frameHeight: number
}

interface FilmstripResponse {
  fileId: string
  url: string
  frames: number
  columns: number
  frameWidth: number
  frameHeight: number
}

interface CacheEntry {
  request: Promise<FilmstripData | null>
  // set once loaded: the filmstrip, or `null` when there is none (no video reviewable)
  result?: FilmstripData | null
  expiresAt?: number
  // decoded images are kept referenced, so the browser does not drop them from memory
  image?: HTMLImageElement
}

// Every hovered thumbnail keeps its filmstrip (~200kB) in memory until evicted
const MAX_ENTRIES = 64

// Used when the response does not say how long it may be cached. Entity filmstrips can change
// (a new reviewable) without the URL changing, and signed S3 URLs expire after an hour.
const DEFAULT_MAX_AGE = 300

// Insertion order is used as LRU order
const entries = new Map<string, CacheEntry>()

const getAuthHeaders = (): HeadersInit => {
  const accessToken = localStorage.getItem('accessToken')
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

const getMaxAge = (response: Response): number => {
  const match = response.headers.get('Cache-Control')?.match(/max-age=(\d+)/)
  return match ? Number(match[1]) : DEFAULT_MAX_AGE
}

interface Fetched {
  data: FilmstripData | null
  maxAge: number
  image?: HTMLImageElement
}

/** Returns `undefined` when the request failed, so it is not cached and retried next time */
const fetchFilmstrip = async (src: string): Promise<Fetched | undefined> => {
  try {
    const response = await fetch(src, { headers: getAuthHeaders() })
    // 204 = the entity has no video reviewable
    if (response.status === 204) return { data: null, maxAge: getMaxAge(response) }
    if (response.status !== 200) return undefined

    const { fileId, url, frames, columns, frameWidth, frameHeight }: FilmstripResponse =
      await response.json()
    if (!url || !frames || !columns || !frameWidth || !frameHeight) return undefined

    // decode ahead, so the first frame is shown without flashing
    const image = new Image()
    image.src = url
    await image.decode()

    return {
      data: { fileId, url, frames, columns, frameWidth, frameHeight },
      maxAge: getMaxAge(response),
      image,
    }
  } catch {
    return undefined
  }
}

// pending requests are fresh too
const isFresh = (entry: CacheEntry) =>
  entry.result === undefined || (entry.expiresAt ?? 0) > Date.now()

const evict = () => {
  while (entries.size > MAX_ENTRIES) {
    entries.delete(entries.keys().next().value as string)
  }
}

/**
 * Returns a loaded filmstrip that is still valid: data, `null` (not available)
 * or `undefined` (not loaded, expired or evicted - call loadFilmstrip)
 */
export const peekFilmstrip = (src: string): FilmstripData | null | undefined => {
  const entry = entries.get(src)
  if (!entry || entry.result === undefined) return undefined
  if (!isFresh(entry)) {
    entries.delete(src)
    return undefined
  }
  return entry.result
}

/** Loads a filmstrip, deduplicating concurrent and repeated requests until it expires */
export const loadFilmstrip = (src: string): Promise<FilmstripData | null> => {
  const existing = entries.get(src)
  if (existing && isFresh(existing)) {
    // mark as recently used
    entries.delete(src)
    entries.set(src, existing)
    return existing.request
  }

  const entry = {} as CacheEntry
  entry.request = fetchFilmstrip(src).then((fetched) => {
    // replaced or evicted while loading: still give the caller what was loaded
    if (entries.get(src) !== entry) return fetched?.data ?? null
    if (!fetched) {
      // failed: don't remember it, the next hover retries
      entries.delete(src)
      return null
    }
    entry.result = fetched.data
    entry.expiresAt = Date.now() + fetched.maxAge * 1000
    entry.image = fetched.image
    return fetched.data
  })
  // drop an expired entry first, so the new one goes to the end of the LRU order
  entries.delete(src)
  entries.set(src, entry)
  evict()
  return entry.request
}
