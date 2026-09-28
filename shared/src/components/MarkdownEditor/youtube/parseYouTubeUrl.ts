export interface YouTubeVideo {
  id: string
  // start time in seconds
  start?: number
}

const VIDEO_ID = /^[\w-]{11}$/

// `90`, `90s`, `1m30s`, `1h2m3s`
const parseStart = (value: string | null): number | undefined => {
  if (!value) return undefined
  if (/^\d+$/.test(value)) return Number(value)
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match || !match[0]) return undefined
  const [, h = '0', m = '0', s = '0'] = match
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

/**
 * The video of a YouTube url, e.g. youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID,
 * youtube.com/embed/ID or youtube.com/live/ID. Null for anything else.
 */
export const parseYouTubeUrl = (value: string): YouTubeVideo | null => {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.replace(/^(www|m|music)\./, '')
  let id: string | null = null
  if (host === 'youtu.be') {
    id = url.pathname.slice(1).split('/')[0]
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v')
    else {
      const [, kind, pathId] = url.pathname.split('/')
      if (['shorts', 'embed', 'live', 'v'].includes(kind)) id = pathId
    }
  }
  if (!id || !VIDEO_ID.test(id)) return null

  const start = parseStart(url.searchParams.get('t') ?? url.searchParams.get('start'))
  return start ? { id, start } : { id }
}

// the url to embed the video with (no tracking cookies until played)
export const getYouTubeEmbedUrl = ({ id, start }: YouTubeVideo) =>
  `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ''}`
