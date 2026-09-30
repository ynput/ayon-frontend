// Loads and caches hover-scrub filmstrips.
//
// A filmstrip is a single image with `frames` video frames laid out in a grid of `columns`
// columns, left to right, top to bottom. The filmstrip endpoints return the layout and an URL
// of the image (served by the server for local storages, a signed URL for S3 storages).

export interface FilmstripData {
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

// Every hovered thumbnail keeps its filmstrip (~200kB) in memory until evicted
const MAX_ENTRIES = 64

// Insertion order is used as LRU order. `null` means "no filmstrip available".
const requests = new Map<string, Promise<FilmstripData | null>>()
const results = new Map<string, FilmstripData | null>()
// decoded images are kept referenced, so the browser does not drop them from memory
const images = new Map<string, HTMLImageElement>()

const getAuthHeaders = (): HeadersInit => {
  const accessToken = localStorage.getItem('accessToken')
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

const fetchFilmstrip = async (src: string): Promise<FilmstripData | null> => {
  try {
    const response = await fetch(src, { headers: getAuthHeaders() })
    // 204 = the entity has no video reviewable
    if (response.status !== 200) return null

    const { url, frames, columns, frameWidth, frameHeight }: FilmstripResponse =
      await response.json()
    if (!url || !frames || !columns || !frameWidth || !frameHeight) return null

    // decode ahead, so the first frame is shown without flashing
    const image = new Image()
    image.src = url
    await image.decode()
    images.set(src, image)

    return { url, frames, columns, frameWidth, frameHeight }
  } catch {
    return null
  }
}

const evict = () => {
  while (requests.size > MAX_ENTRIES) {
    const oldest = requests.keys().next().value as string
    requests.delete(oldest)
    results.delete(oldest)
    images.delete(oldest)
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
      images.delete(src)
      return null
    }
    results.set(src, data)
    return data
  })
  requests.set(src, request)
  evict()
  return request
}
