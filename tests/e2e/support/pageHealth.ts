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

/**
 * Watches a page for signs that it is broken while a test has it open:
 * - uncaught exceptions (`pageerror`) and `console.error` messages,
 * - failed API calls: `/api`, `/graphql` and addon (`/addons`) responses with status >= 400,
 *   and GraphQL responses that carry `errors`,
 * - the app's error screens (error boundary, error page, error placeholders, error toasts).
 *
 * Usage:
 * ```ts
 * const health = watchPageHealth(page)
 * await page.goto('/settings/bundles')
 * await expect(page.getByRole('table')).toBeVisible()
 * await health.expectHealthy()
 * ```
 * Anything expected goes into `KNOWN_NOISE` (or the `allow` option of one check) with a FLAG comment.
 */

export type NoiseKind = 'pageerror' | 'console' | 'response' | 'graphql'

export type Noise = {
  kind: NoiseKind
  /** matched against the problem text, e.g. `GET 404 /api/...` or the console message */
  pattern: RegExp
  /** why this is not a bug of the page under test */
  reason: string
}

/** Noise that is expected on any page. Keep it tiny and specific (exact URLs and messages). */
export const KNOWN_NOISE: Noise[] = [
  {
    kind: 'console',
    pattern: /^Failed to load resource: net::ERR_FAILED https:\/\/do\.featurebase\.app\//,
    // FLAG: test setup, not the app. The `page` fixture aborts featurebase (changelog and survey
    // popups) and the browser logs the aborted script.
    reason: 'the page fixture blocks featurebase',
  },
  {
    kind: 'response',
    pattern: /^GET 404 \/api\/views\/[\w-]+\/(working|base|default)(\?project_name=\w+)?$/,
    // FLAG: the views API answers 404 while the user has no working, base or default view of a page
    // (ayon-backend api/views/views.py), which is the normal state of every fresh page and project.
    reason: 'no saved view yet',
  },
  {
    kind: 'console',
    pattern: /^ERROR \[get(Working|Base|Default)View\] \{status: 404\b/,
    // FLAG: ...and the RTK base query logs every failed request with console.error, including these
    // expected 404s (shared/src/api/base/client.ts, baseQueryWithRedirect).
    reason: 'no saved view yet, logged by the base query',
  },
  {
    kind: 'response',
    pattern:
      /^GET 404 \/addons\/archival_tool\/[^/]+\/frontend\/modules\/archival_tool\/remoteEntry\.js\?/,
    // FLAG (server, not the app): the archival_tool addon on the ayon-dev server declares a frontend
    // module but ships no `frontend/modules` build. The app loads remotes at start-up and only logs
    // the failure, so it shows on every page.
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
    // FLAG (backend bug, see "Still open" in tests/AGENTS.md): the header asks whether the admin has
    // unread messages, and the backend reads the inbox of every project for that. It fails while
    // another test (or another run) creates or drops a project.
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

/** what the frontend proxies to the backend (vite.config.ts) */
const BACKEND_PATH = /^\/(api|graphql|graphiql|docs|addons)(\/|$)/
/**
 * Data requests a page waits for before it is "settled".
 * - Not the static addon files under /addons: module scripts the browser reuses from its cache
 *   never report `requestfinished`.
 * - Not /api/connect: the server forwards these to Ynput Cloud (e.g. the feedback verification of a
 *   new user), which can take longer than any page. They are still checked once they answer.
 */
const DATA_PATH = /^\/(api(?!\/connect(\/|$))|graphql)(\/|$)/

export class PageHealth {
  private readonly problems: Problem[] = []
  private readonly inflight = new Set<Request>()
  private readonly reads: Promise<void>[] = []
  /** origin of the frontend under test; backend calls go through its proxy */
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
      // the browser logs every failed request; backend ones are reported (with method) by
      // onResponse, so only keep the others (images, scripts, ...)
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

  /** Stops collecting, e.g. before watching the next page of the same tab */
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

  /**
   * The app's error screens:
   * - `ErrorFallback` (the error boundary around the app): "Something went wrong, please send a report to Ynput."
   *   or "AYON has been updated. Please reload for changes."
   * - `EmptyPlaceholder` with an error: "Something went wrong." (and e.g. ProjectRoots' "Something went wrong while ...")
   * - `ErrorPage`: "ERROR 404", "ERROR" + "Server connection failed"
   * - `ProjectPage`: "Project Not Found, Redirecting..." and "Module Not Found"
   * - error toasts
   */
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

  /** Waits until no backend request of the page is in flight */
  async settle() {
    // the pending URLs, as the poll's value, so a timeout says which requests hang
    await expect
      .poll(() => [...this.inflight].map((r) => `${r.method()} ${this.path(r.url())}`), {
        message: 'backend requests still in flight',
        timeout: 30_000,
      })
      .toEqual([])
    await Promise.all(this.reads)
  }

  /** Problems collected so far, one line each */
  list(): string[] {
    return this.problems.map((p) => `[${p.kind}] ${p.text}`)
  }

  /**
   * Fails with a readable list if the page showed an error screen or logged problems.
   * Call it once the page shows its "ready" signal; it first waits for the page's requests.
   * - `soft`: keep the test going (one test, several pages)
   * - `settle: false`: check right away, e.g. to explain why a page never got ready
   */
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

/** Starts collecting problems of `page`; call before `page.goto` */
export const watchPageHealth = (page: Page, options: { allow?: Noise[] } = {}) =>
  new PageHealth(page, options.allow)
