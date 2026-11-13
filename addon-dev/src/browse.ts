// `ayon-addon open | preview`: the dev shell in a headless browser, for agents and scripts.
// Starts the standalone dev server unless --url points at a running one, waits until the
// contribution rendered, and reports what happened (errors, toasts, the context it got).
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'
import type { ViteDevServer } from 'vite'
import { expectedPiece, menuOpener, pieceProblems, playwrightLocations } from './openChecks.js'
import type { PieceStatus } from './openChecks.js'
import { findConnection, importFromProject, keySetupMessage } from './project.js'
import { STANDALONE_ENV } from './standalone.js'

export interface BrowseOptions {
  root: string
  slot: string
  id: string
  /** preview mode: the fixture's name (dev/fixtures/<name>.json) */
  fixture?: string
  project?: string
  /** `type:id,type:id` */
  entities?: string
  page?: string
  /** a running `ayon-addon dev` */
  url?: string
  screenshot?: string
  /** run the menu item (`run` piece) and report what it did */
  run?: boolean
  /** live mode: save what the contribution loaded as dev/fixtures/<name>.json */
  saveFixture?: string
  /** preview: keep only the fixture answers the page used */
  prune?: boolean
  timeout?: number
}

export interface BrowseResult {
  ok: boolean
  mode: 'live' | 'preview'
  url: string
  slot: string
  id: string
  /** the slot context the contribution got (functions and elements left out) */
  context?: Record<string, unknown>
  /** contributions that crashed or failed to load (AYON's error boxes) */
  contributionErrors: string[]
  /** console errors and uncaught exceptions */
  errors: string[]
  warnings: string[]
  toasts: string[]
  /** with --run: what the item put on the clipboard */
  clipboard?: string
  /** preview: requests the fixture has no answer for */
  unmatched?: string[]
  screenshot?: string
  savedFixture?: string
  /** with --prune: the answers removed from the fixture */
  pruned?: number
  /** the contribution's pieces: which mounted, how often `run` ran */
  pieces?: PieceStatus
  /** what it checked about the contribution that failed: not rendered, not run */
  problems: string[]
}

export type { PieceStatus } from './openChecks.js'

type Playwright = typeof import('playwright')

const loadPlaywright = async (root: string): Promise<Playwright> => {
  // a CommonJS package: its API is the default export
  const api = (module: Playwright & { default?: Playwright }) => module.default ?? module
  const locations = playwrightLocations(root, import.meta.url)
  for (const location of locations) {
    let resolved: string
    try {
      resolved = createRequire(location).resolve('playwright')
    } catch {
      continue
    }
    return api(await import(pathToFileURL(resolved).href))
  }
  throw new Error(
    [
      'playwright is not installed: yarn add -D playwright && npx playwright install chromium',
      `  looked from: ${locations.map((location) => path.dirname(location)).join(', ')}`,
    ].join('\n'),
  )
}

// 127.0.0.1, not localhost: "localhost" is both 127.0.0.1 and ::1. Vite only moves on to the next
// port when its own address is taken, so with something else on [::1]:5180 it listened on
// 127.0.0.1:5180, printed http://localhost:5180, and the browser went to the other server (which
// never answered: page.goto timed out). One address for both makes a busy port a busy port.
export const DEV_HOST = '127.0.0.1'
export const DEV_PORT = 5180

const startServer = async (root: string): Promise<ViteDevServer> => {
  const vite = await importFromProject<typeof import('vite')>(root, 'vite')
  process.env[STANDALONE_ENV] = '1'
  const server = await vite.createServer({
    root,
    logLevel: 'error',
    // the next free port when it is taken
    server: { host: DEV_HOST, port: DEV_PORT, strictPort: false },
  })
  await server.listen()
  return server
}

export const browse = async (options: BrowseOptions): Promise<BrowseResult> => {
  const mode = options.fixture ? 'preview' : 'live'
  if (mode === 'live' && !options.url && !findConnection(options.root).apiKey) {
    throw new Error(keySetupMessage(options.root))
  }
  // before the dev server: without playwright there is nothing to stop
  const { chromium } = await loadPlaywright(options.root)
  const server = options.url ? undefined : await startServer(options.root)
  const base = options.url || server!.resolvedUrls!.local[0]
  // the shell's URL parameters (shell/src/params.ts)
  const params = new URLSearchParams({ slot: options.slot, contribution: options.id })
  if (options.fixture) params.set('preview', options.fixture)
  if (options.project) params.set('ctxProject', options.project)
  if (options.entities) params.set('ctxEntities', options.entities)
  if (options.page) params.set('ctxPage', options.page)
  const url = `${base.replace(/\/$/, '')}/?${params}`

  const browser = await chromium.launch().catch(async (error: Error) => {
    await server?.close()
    throw error
  })
  const result: BrowseResult = {
    ok: false,
    mode,
    url,
    slot: options.slot,
    id: options.id,
    contributionErrors: [],
    errors: [],
    warnings: [],
    toasts: [],
    problems: [],
  }
  let ready = false
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base })
    const page = await context.newPage()
    page.on('console', (message) => {
      const text = message.text()
      // React's development warnings are console errors, but not failures
      if (message.type() === 'error' && !text.startsWith('Warning:')) result.errors.push(text)
      else if (message.type() === 'error' || message.type() === 'warning') result.warnings.push(text)
    })
    page.on('pageerror', (error) => result.errors.push(error.stack || error.message))

    await page.goto(url)
    const timeout = options.timeout ?? 30000
    try {
      await page.waitForFunction(() => window.__AYON_ADDON_SHELL__?.ready === true, undefined, { timeout })
    } catch {
      const text = await page.locator('body').innerText()
      result.errors.push(`the stage didn't get ready in ${timeout} ms: ${text.slice(0, 300)}`)
    }
    // the contribution's own requests and lazy pieces
    await page.waitForLoadState('networkidle').catch(() => undefined)
    await page.waitForTimeout(1000)

    ready = await page.evaluate(() => window.__AYON_ADDON_SHELL__?.ready === true)
    // a menu slot: open the menu, so the screenshot shows its items
    const opener = ready ? menuOpener(options.slot) : undefined
    if (opener) {
      await page
        .locator(opener.selector)
        .first()
        .click({ button: opener.button, timeout: 5000 })
        // off the button: the slot inspector's card over the menu goes
        .then(() => page.mouse.move(1, 1))
        .then(() => page.waitForTimeout(500))
        .catch(() => result.warnings.push(`could not open the menu of ${options.slot} (${opener.selector})`))
    }
    // the contribution's component mounted (the shell selects a tab or Customize section itself)
    const tracked = await page.evaluate(() => window.__AYON_ADDON_SHELL__?.pieces?.tracked)
    const piece = tracked && expectedPiece(tracked)
    if (ready && piece) {
      await page
        .waitForFunction((name) => !!window.__AYON_ADDON_SHELL__?.pieces.mounted[name], piece, {
          timeout: Math.min(timeout, 10000),
        })
        .catch(() => undefined)
    }
    if (options.run && ready) {
      await page.evaluate(() => window.__AYON_ADDON_SHELL__!.run())
      await page.waitForTimeout(1000)
      result.clipboard = await page.evaluate(() => navigator.clipboard.readText()).catch(() => undefined)
    }

    const status = await page.evaluate(() => {
      const shell = window.__AYON_ADDON_SHELL__
      return shell && { fixture: shell.fixture(), unmatched: shell.unmatched, used: shell.used, pieces: shell.pieces }
    })
    result.pieces = status?.pieces
    if (ready && status?.pieces) result.problems = pieceProblems(options.slot, options.id, status.pieces, options.run)
    // a dev shell of an older @ynput/ayon-addon-dev (--url) doesn't report its pieces
    else if (ready) result.warnings.push('the dev shell does not report whether the contribution rendered')
    result.context = status?.fixture?.context
    if (mode === 'preview') result.unmatched = status?.unmatched
    // without the box's icon name
    result.contributionErrors = (await page.locator('.ayon-addon-error').allInnerTexts()).map(
      (text) => text.replace(/^error\s+/, ''),
    )
    result.toasts = await page.locator('.Toastify__toast').allInnerTexts()

    if (options.prune && options.fixture && status && !status.unmatched.length) {
      const file = path.join(options.root, 'dev', 'fixtures', `${options.fixture}.json`)
      const fixture = JSON.parse(readFileSync(file, 'utf8')) as { responses: Record<string, unknown> }
      const keys = Object.keys(fixture.responses)
      fixture.responses = Object.fromEntries(keys.filter((key) => status.used.includes(key)).map((key) => [key, fixture.responses[key]]))
      writeFileSync(file, `${JSON.stringify(fixture, null, 2)}\n`)
      result.pruned = keys.length - Object.keys(fixture.responses).length
    }
    if (options.saveFixture && status?.fixture) {
      const file = path.join(options.root, 'dev', 'fixtures', `${options.saveFixture}.json`)
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, `${JSON.stringify(status.fixture, null, 2)}\n`)
      result.savedFixture = path.relative(options.root, file)
    }
    if (options.screenshot) {
      const file = path.resolve(options.root, options.screenshot)
      mkdirSync(path.dirname(file), { recursive: true })
      await page.screenshot({ path: file })
      result.screenshot = file
    }
  } finally {
    await browser.close()
    await server?.close()
  }
  // a failed contribution logs an "[addon <name>]" error (ContributionView, runContribution)
  const addonErrors = result.errors.filter((error) => error.startsWith('[addon '))
  result.ok =
    ready &&
    !!result.context &&
    result.contributionErrors.length === 0 &&
    addonErrors.length === 0 &&
    result.problems.length === 0 &&
    !(result.unmatched?.length)
  return result
}

export const formatBrowse = (result: BrowseResult) =>
  [
    `${result.ok ? 'ok' : 'FAILED'}: ${result.slot} ${result.id} (${result.mode}) ${result.url}`,
    ...result.problems.map((problem) => `  problem: ${problem}`),
    ...result.contributionErrors.map((error) => `  error box: ${error}`),
    ...result.errors.map((error) => `  console error: ${error.split('\n')[0]}`),
    ...result.toasts.map((toast) => `  toast: ${toast}`),
    ...(result.clipboard ? [`  clipboard: ${result.clipboard}`] : []),
    ...(result.unmatched || []).map((key) => `  not in the fixture: ${key}`),
    ...(result.savedFixture ? [`  saved ${result.savedFixture}`] : []),
    ...(result.pruned !== undefined ? [`  pruned ${result.pruned} unused answers from the fixture`] : []),
    ...(result.screenshot ? [`  screenshot ${result.screenshot}`] : []),
  ].join('\n')

declare global {
  interface Window {
    __AYON_ADDON_SHELL__?: {
      ready: boolean
      unmatched: string[]
      used: string[]
      fixture: () => { context: Record<string, unknown> } | undefined
      run: () => Promise<void>
      pieces: PieceStatus
    }
  }
}
