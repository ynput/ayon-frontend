import type { Fixture, RecordedResponse } from './types'

// The shell's view of the network. Live: records the JSON answers of AYON, for saving the current
// selection as a preview fixture. Preview: answers from the fixture and never reaches a server.
// Covers fetch (RTK Query, graphql-request); axios requests (a few shared components) are not.

const originalFetch = window.fetch.bind(window)

const PREVIEW_USER = {
  name: 'preview',
  attrib: { fullName: 'Preview user', email: 'preview@example.com' },
  data: { isAdmin: true, isManager: true, isGuest: false },
  uiExposureLevel: 1000,
}

// What the app around the contribution asks for (user, site info, project list, cloud status).
// Preview answers these itself and saved fixtures leave them out: they describe the studio
// (its projects, its cloud subscription), not the contribution, and fixtures get committed.
const APP_ANSWERS: Record<string, unknown> = {
  '/api/users/me': PREVIEW_USER,
  '/api/info': {
    version: 'preview',
    user: PREVIEW_USER,
    attributes: [],
    sites: [],
    ssoOptions: [],
    frontendFlags: [],
    extras: '',
    disableChangelog: true,
  },
  '/api/projects': { detail: '', count: 0, projects: [] },
  '/api/connect': { connected: false, offlineMode: true },
}
const appPath = (key: string) => {
  const match = key.match(/^GET ([^?]+)/)
  return match && match[1] in APP_ANSWERS ? match[1] : undefined
}
const recorded = new Map<string, RecordedResponse>()
let fixture: Fixture | undefined
const unmatched = new Set<string>()
// preview: the fixture answers that were used, for `ayon-addon preview --prune`
const used = new Set<string>()
const listeners = new Set<() => void>()

const isAyonRequest = (url: URL) =>
  url.origin === window.location.origin &&
  (url.pathname.startsWith('/api') || url.pathname.startsWith('/graphql'))

const requestKey = async (url: URL, method: string, body: BodyInit | null | undefined) => {
  if (url.pathname.startsWith('/graphql') && typeof body === 'string') {
    try {
      const { operationName, query } = JSON.parse(body) as { operationName?: string; query?: string }
      const name = operationName || query?.match(/(?:query|mutation)\s+(\w+)/)?.[1]
      if (name) return `graphql ${name}`
    } catch {
      // not JSON: keyed by path below
    }
  }
  return `${method.toUpperCase()} ${url.pathname}${url.search}`
}

const toRequest = (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : undefined
  const url = new URL(request ? request.url : String(input), window.location.href)
  const method = init?.method || request?.method || 'GET'
  return { url, method }
}

const readBody = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.body !== undefined) return init.body
  if (input instanceof Request && input.method !== 'GET') return input.clone().text()
  return undefined
}

export const installNetwork = (mode: 'live' | 'preview') => {
  window.fetch = async (input, init) => {
    const { url, method } = toRequest(input, init)
    if (!isAyonRequest(url)) return originalFetch(input, init)
    const key = await requestKey(url, method, await readBody(input, init))

    if (mode === 'preview') {
      const app = appPath(key)
      const answer =
        fixture?.responses[key] || (app ? { status: 200, body: APP_ANSWERS[app] } : undefined)
      if (!answer) {
        unmatched.add(key)
        listeners.forEach((listener) => listener())
        console.warn(`[ayon-addon preview] no fixture answer for ${key}`)
        return new Response(JSON.stringify({ detail: `no fixture answer for ${key}` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (fixture?.responses[key]) used.add(key)
      return new Response(JSON.stringify(answer.body), {
        status: answer.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const response = await originalFetch(input, init)
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      response
        .clone()
        .json()
        .then((body) => recorded.set(key, { status: response.status, body }))
        .catch(() => undefined)
    }
    return response
  }
}

export const getFixture = () => fixture

export const setFixture = (next: Fixture | undefined) => {
  fixture = next
  unmatched.clear()
  used.clear()
}

/** What was recorded, without the app's own requests (see APP_ANSWERS). */
export const getRecorded = () =>
  Object.fromEntries([...recorded].filter(([key]) => !appPath(key)))
export const getUnmatched = () => [...unmatched]
export const getUsed = () => [...used]
export const onUnmatched = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
