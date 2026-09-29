// Loads and caches hover-scrub filmstrips.
//
// A filmstrip is a single image with `frames` video frames laid out in a grid of `columns`
// columns, left to right, top to bottom. The layout is only available in the response headers,
// so the image is fetched (instead of used directly in an <img>) and kept as an object URL.

export interface FilmstripData {
  url: string // object URL of the decoded filmstrip image
  frames: number
  columns: number
  frameWidth: number
  frameHeight: number
}

// Every hovered thumbnail keeps its filmstrip (~200kB) in memory until evicted
const MAX_ENTRIES = 64

// Insertion order is used as LRU order. `null` means "no filmstrip available".
const requests = new Map<string, Promise<FilmstripData | null>>()
const results = new Map<string, FilmstripData | null>()

const getAuthHeaders = (): HeadersInit => {
  const accessToken = localStorage.getItem('accessToken')
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

const fetchFilmstrip = async (src: string): Promise<FilmstripData | null> => {
  try {
    const response = await fetch(src, { headers: getAuthHeaders() })
    // 204 = the entity has no video reviewable
    if (response.status !== 200) return null

    const frames = Number(response.headers.get('X-Filmstrip-Frames'))
    const frameWidth = Number(response.headers.get('X-Filmstrip-Frame-Width'))
    const frameHeight = Number(response.headers.get('X-Filmstrip-Frame-Height'))
    if (!frames || !frameWidth || !frameHeight) return null
    // a single row when the server does not say otherwise
    const columns = Number(response.headers.get('X-Filmstrip-Columns')) || frames

    const url = URL.createObjectURL(await response.blob())

    // decode ahead, so the first frame is shown without flashing
    const image = new Image()
    image.src = url
    try {
      await image.decode()
    } catch {
      URL.revokeObjectURL(url)
      return null
    }

    return { url, frames, columns, frameWidth, frameHeight }
  } catch {
    return null
  }
}

const evict = () => {
  while (requests.size > MAX_ENTRIES) {
    const oldest = requests.keys().next().value as string
    requests.delete(oldest)
    const data = results.get(oldest)
    if (data) URL.revokeObjectURL(data.url)
    results.delete(oldest)
  }
}

/** Returns an already loaded filmstrip: data, `null` (not available) or `undefined` (not loaded) */
export const peekFilmstrip = (src: string): FilmstripData | null | undefined => results.get(src)

/** Loads a filmstrip, deduplicating concurrent and repeated requests */
export const loadFilmstrip = (src: string): Promise<FilmstripData | null> => {
  const existing = requests.get(src)
  if (existing) {
    // mark as recently used
    requests.delete(src)
    requests.set(src, existing)
    return existing
  }

  const request = fetchFilmstrip(src).then((data) => {
    if (requests.get(src) !== request) {
      // evicted while loading
      if (data) URL.revokeObjectURL(data.url)
      return null
    }
    results.set(src, data)
    return data
  })
  requests.set(src, request)
  evict()
  return request
}
