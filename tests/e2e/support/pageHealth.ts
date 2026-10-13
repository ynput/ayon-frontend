import {
  ConsoleMessage,
  expect,
  Frame,
  Locator,
  Page,
  Request,
  Response,
  test,
} from '@playwright/test'

export type NoiseKind = 'pageerror' | 'console' | 'response' | 'graphql'

export type Noise = {
  kind: NoiseKind
  pattern: RegExp
  reason: string
}

export const KNOWN_NOISE: Noise[] = [
  {
    kind: 'console',
    pattern: /^Failed to load resource: net::ERR_FAILED https:\/\/do\.featurebase\.app\//,
    // FLAG: test setup, not the app: the `page` fixture aborts featurebase and the browser logs it
    reason: 'the page fixture blocks featurebase',
  },
  {
    kind: 'response',
    pattern: /^GET 404 \/api\/views\/[\w-]+\/(working|base|default)(\?project_name=\w+)?$/,
    // FLAG: the views API answers 404 until the user has a working, base or default view of a page
    reason: 'no saved view yet',
  },
  {
    kind: 'console',
    pattern: /^ERROR \[get(Working|Base|Default)View\] \{status: 404\b/,
    // FLAG: ...and the RTK base query logs every failed request with console.error, these 404s too
    reason: 'no saved view yet, logged by the base query',
  },
  {
    kind: 'response',
    pattern:
      /^GET 404 \/addons\/archival_tool\/[^/]+\/frontend\/modules\/archival_tool\/remoteEntry\.js\?/,
    // FLAG (server, not the app): the dev server's archival_tool addon declares a frontend it lacks
    reason: 'broken archival_tool addon package on the dev server',
  },
  {
    kind: 'console',
    pattern:
      /^error loading remote archival_tool App TypeError: Failed to fetch dynamically imported module: /,
    // FLAG (server, not the app): see the archival_tool entry above
    reason: 'broken archival_tool addon package on the dev server',
  },
  {
    kind: 'graphql',
    pattern: /^GraphQL GetInboxHasUnread: relation "project_\w+\.activity_feed" does not exist$/,
    // FLAG (backend bug, see tests/AGENTS.md): the admin inbox query fails while projects are created/dropped
    reason: 'admin inbox query races with project create/drop',
  },
  {
    kind: 'console',
    pattern: /^ERROR \[GetInboxHasUnread\] \{status: 200\b/,
    // FLAG: ...logged by the base query; only the cause above is allowed (its [graphql] line)
    reason: 'admin inbox query races with project create/drop, logged by the base query',
  },
]

type Problem = { kind: NoiseKind; text: string }

const BACKEND_PATH = /^\/(api|graphql|graphiql|docs|addons)(\/|$)/
// not /addons (cached module scripts never finish) or /api/connect (forwarded to Ynput Cloud, slow)
const DATA_PATH = /^\/(api(?!\/connect(\/|$))|graphql)(\/|$)/

export class PageHealth {
  private readonly problems: Problem[] = []
  private readonly inflight = new Set<Request>()
  private readonly reads: Promise<void>[] = []
  private readonly origin: string
  private readonly stopListening: () => void

  constructor(readonly page: Page, private readonly allow: Noise[] = []) {
    this.origin = new URL(test.info().project.use.baseURL!).origin

    const onPageError = (error: Error) => {
      this.add('pageerror', `Uncaught ${error.name}: ${error.message}`)
    }

    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== 'error') return
      const text = message.text()
      const { url } = message.location()
      const failedResource = text.startsWith('Failed to load resource') && !!url
      // backend failures are reported (with method) by onResponse
      if (failedResource && this.isBackend(url)) return
      this.add('console', failedResource ? `${text} ${url}` : text)
    }

    const onRequest = (request: Request) => {
      if (this.isBackend(request.url(), DATA_PATH)) this.inflight.add(request)
    }
    const onRequestDone = (request: Request) => {
      this.inflight.delete(request)
    }
    // a new document cancels the requests of the old one, often without a `requestfailed`
    const onNavigated = (frame: Frame) => {
      if (frame === page.mainFrame()) this.inflight.clear()
    }

    const onResponse = (response: Response) => {
      const url = response.url()
      if (!this.isBackend(url)) return
      const request = response.request()
      const path = this.path(url)
      const status = response.status()
      if (status >= 400) {
        this.add('response', `${request.method()} ${status} ${path}`)
        return
      }
      if (path.startsWith('/graphql') && status === 200) {
        this.reads.push(
          response
            .json()
            .then((body) => {
              for (const error of body?.errors ?? []) {
                const operation = request.postDataJSON()?.operationName ?? 'anonymous'
                this.add('graphql', `GraphQL ${operation}: ${error.message}`)
              }
            })
            // the body is gone when the page navigated away in the meantime
            .catch(() => undefined),
        )
      }
    }

    page.on('pageerror', onPageError)
    page.on('console', onConsole)
    page.on('request', onRequest)
    page.on('requestfinished', onRequestDone)
    page.on('requestfailed', onRequestDone)
    page.on('framenavigated', onNavigated)
    page.on('response', onResponse)
    this.stopListening = () => {
      page.off('pageerror', onPageError)
      page.off('console', onConsole)
      page.off('request', onRequest)
      page.off('requestfinished', onRequestDone)
      page.off('requestfailed', onRequestDone)
      page.off('framenavigated', onNavigated)
      page.off('response', onResponse)
    }
  }

  stop() {
    this.stopListening()
  }

  private isBackend(url: string, paths = BACKEND_PATH) {
    try {
      const { origin, pathname } = new URL(url)
      return origin === this.origin && paths.test(pathname)
    } catch {
      return false
    }
  }

  private path(url: string) {
    const { pathname, search } = new URL(url)
    return pathname + search
  }

  private add(kind: NoiseKind, text: string) {
    const noise = [...KNOWN_NOISE, ...this.allow]
    if (noise.some((n) => n.kind === kind && n.pattern.test(text))) return
    this.problems.push({ kind, text })
  }

  errorScreens(): Locator {
    const page = this.page
    return (
      page
        .getByRole('heading', { name: /^Something went wrong/ })
        .or(page.getByRole('heading', { name: /^AYON has been updated/ }))
        .or(page.getByRole('heading', { name: /^ERROR\b/ }))
        .or(page.getByText(/^(Project Not Found, Redirecting|Module Not Found)/))
        // FLAG: react-toastify marks the type only with a class
        .or(page.locator('.Toastify__toast--error'))
    )
  }

  async settle() {
    await expect
      .poll(() => [...this.inflight].map((r) => `${r.method()} ${this.path(r.url())}`), {
        message: 'backend requests still in flight',
        timeout: 30_000,
      })
      .toEqual([])
    await Promise.all(this.reads)
  }

  list(): string[] {
    return this.problems.map((p) => `[${p.kind}] ${p.text}`)
  }

  async expectHealthy({ soft = false, settle = true } = {}) {
    if (settle) await this.settle()
    const screens = await this.errorScreens().allInnerTexts()
    const problems = [
      ...screens.map((text) => `[screen] ${text.replace(/\s+/g, ' ').trim()}`),
      ...this.list(),
    ]
    const message = `${this.page.url()} is not healthy:\n  ${problems.join('\n  ')}\n`
    if (soft) expect.soft(problems, message).toEqual([])
    else expect(problems, message).toEqual([])
  }
}

export const watchPageHealth = (page: Page, options: { allow?: Noise[] } = {}) =>
  new PageHealth(page, options.allow)
