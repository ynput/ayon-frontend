import type { Fixture, RecordedResponse } from './types'

// The shell's view of the network. Live: records the JSON answers of AYON, for saving the current
// selection as a preview fixture. Preview: answers from the fixture and never reaches a server,
// for fetch (RTK Query, graphql-request) and XMLHttpRequest (axios, e.g. comment uploads): the dev
// server's proxy signs requests with the API key, so nothing may get through to it. Live records
// fetch only.

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

// preview: the fixture's answer, else the shell's own for the app's requests, else a 404 that
// fails the preview
const previewAnswer = (key: string): RecordedResponse => {
  const app = appPath(key)
  const answer = fixture?.responses[key] || (app ? { status: 200, body: APP_ANSWERS[app] } : undefined)
  if (!answer) {
    unmatched.add(key)
    listeners.forEach((listener) => listener())
    console.warn(`[ayon-addon preview] no fixture answer for ${key}`)
    return { status: 404, body: { detail: `no fixture answer for ${key}` } }
  }
  if (fixture?.responses[key]) used.add(key)
  return answer
}

// preview: AYON requests made with XMLHttpRequest are answered here and never sent
const OriginalXHR = window.XMLHttpRequest
class PreviewXHR extends OriginalXHR {
  private ayonRequest?: { url: URL; method: string }

  open(method: string, url: string | URL, ...rest: [boolean?, string?, string?]) {
    const target = new URL(String(url), window.location.href)
    this.ayonRequest = isAyonRequest(target) ? { url: target, method } : undefined
    // @ts-expect-error the async, user and password arguments are passed on as given
    return super.open(method, url, ...rest)
  }

  send(body?: Document | XMLHttpRequestBodyInit | null) {
    const request = this.ayonRequest
    if (!request) return super.send(body)
    void requestKey(request.url, request.method, body as BodyInit | null).then((key) => {
      const { status, body: answer } = previewAnswer(key)
      const text = JSON.stringify(answer)
      const responses: Record<string, unknown> = {
        readyState: 4,
        status,
        statusText: status === 200 ? 'OK' : 'Not Found',
        responseURL: request.url.href,
        responseText: text,
        response: this.responseType === 'json' ? answer : text,
      }
      for (const [name, value] of Object.entries(responses)) {
        Object.defineProperty(this, name, { value, configurable: true })
      }
      this.getAllResponseHeaders = () => 'content-type: application/json\r\n'
      this.getResponseHeader = (name: string) =>
        name.toLowerCase() === 'content-type' ? 'application/json' : null
      for (const type of ['readystatechange', 'load', 'loadend']) this.dispatchEvent(new Event(type))
    })
  }
}

export const installNetwork = (mode: 'live' | 'preview') => {
  if (mode === 'preview') window.XMLHttpRequest = PreviewXHR
  window.fetch = async (input, init) => {
    const { url, method } = toRequest(input, init)
    if (!isAyonRequest(url)) return originalFetch(input, init)
    const key = await requestKey(url, method, await readBody(input, init))

    if (mode === 'preview') {
      const answer = previewAnswer(key)
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
