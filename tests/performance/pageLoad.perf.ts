import { test, expect, Browser, BrowserContext, Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { ROUTES, PerfRoute } from './routes'
import { PERF_STORAGE_STATE } from '../../playwright.perf.config'
import { PARTIAL_DIR, OUT_DIR, RouteResult, Sample, summarize, formatRow } from './perfResults'

/**
 * Page load benchmark: hard-loads each route several times and records how long it takes
 * until the page shows real content. See tests/performance/AGENTS.md.
 */

const RUNS = Number(process.env.PERF_RUNS || 5)
// added latency for every request, to mimic a remote server (ms)
const LATENCY = Number(process.env.PERF_LATENCY || 0)
// CPU slowdown factor (1 = no throttling)
const CPU = Number(process.env.PERF_CPU || 1)
const SETTLE_MS = Number(process.env.PERF_SETTLE_MS || 300)
const READY_TIMEOUT = Number(process.env.PERF_READY_TIMEOUT || 30_000)
const ONLY = process.env.PERF_ROUTES?.split(',').map((s) => s.trim())
const DEBUG = !!process.env.PERF_DEBUG

// runs in the page before any app code: records when the full page loader goes away
const initScript = () => {
  const w = window as any
  w.__perf = { shell: null as number | null, done: false }
  const tick = () => {
    const root = document.getElementById('root')
    const hasLoader = !!document.querySelector('[data-loading-page]')
    const hasApp = !!root && root.childElementCount > 1
    if (hasApp && !hasLoader) {
      if (w.__perf.shell === null) w.__perf.shell = performance.now()
    } else {
      w.__perf.shell = null
    }
    if (!w.__perf.done) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// loading shimmers that mean the page is still loading; thumbnails are excluded, they are images
// from the server that load after the content (and depend on the server, not the app)
const SHIMMER = '.loading:not(.no-shimmer):not(.thumbnail)'

const waitForReady = async (page: Page, route: PerfRoute) => {
  const handle = await page.waitForFunction(
    ({ selectors, settle, SHIMMER }) => {
      const w = window as any
      const visible = (el: Element) =>
        (el as any).checkVisibility
          ? (el as any).checkVisibility()
          : !!((el as HTMLElement).offsetWidth || (el as HTMLElement).offsetHeight)

      const ok =
        !document.querySelector('[data-loading-page]') &&
        selectors.every((s: string) => [...document.querySelectorAll(s)].some(visible)) &&
        ![...document.querySelectorAll(SHIMMER)].some(visible)

      const now = performance.now()
      if (!ok) {
        w.__readySince = null
        return false
      }
      if (w.__readySince == null) w.__readySince = now
      return now - w.__readySince >= settle ? w.__readySince : false
    },
    { selectors: route.ready, settle: SETTLE_MS, SHIMMER },
    { polling: 'raf', timeout: READY_TIMEOUT },
  )
  return (await handle.jsonValue()) as number
}

const collect = async (page: Page, ready: number): Promise<Sample> =>
  page.evaluate((ready) => {
    const w = window as any
    w.__perf.done = true
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const before = resources.filter((r) => r.responseEnd <= ready)
    // same origin only: third party URLs can carry tokens
    const isApi = (r: PerformanceResourceTiming) =>
      r.name.startsWith(location.origin) &&
      /^\/(api|graphql)(\/|$|\?)/.test(new URL(r.name).pathname)
    const isJs = (r: PerformanceResourceTiming) => /\.m?js(\?|$)/.test(r.name)
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null
    return {
      fcp,
      shell: w.__perf.shell,
      ready,
      requests: before.length,
      apiRequests: before.filter(isApi).length,
      jsKB: Math.round(
        before.filter(isJs).reduce((sum, r) => sum + (r.encodedBodySize || 0), 0) / 1024,
      ),
      api: before
        .filter(isApi)
        .map((r) => {
          const url = new URL(r.name)
          return {
            url: url.pathname + url.search,
            start: Math.round(r.startTime),
            end: Math.round(r.responseEnd),
          }
        })
        .sort((a, b) => a.start - b.start),
    }
  }, ready)

const newContext = async (browser: Browser, use: Record<string, any>) =>
  browser.newContext({
    storageState: PERF_STORAGE_STATE,
    viewport: use.viewport,
    baseURL: use.baseURL,
  })

const throttle = async (context: BrowserContext, page: Page) => {
  if (!LATENCY && CPU === 1) return
  const cdp = await context.newCDPSession(page)
  if (LATENCY) {
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: LATENCY,
      downloadThroughput: -1,
      uploadThroughput: -1,
    })
  }
  if (CPU !== 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
}

const load = async (page: Page, route: PerfRoute, reload: boolean): Promise<Sample> => {
  try {
    if (reload) await page.reload({ waitUntil: 'commit' })
    else await page.goto(route.path, { waitUntil: 'commit' })
    const ready = await waitForReady(page, route)
    return await collect(page, ready)
  } catch (error: any) {
    const name = `${route.name}-failed-${Date.now()}.png`
    fs.mkdirSync(OUT_DIR, { recursive: true })
    await page.screenshot({ path: path.join(OUT_DIR, name) }).catch(() => {})
    return { error: `${String(error?.message || error).split('\n')[0]} (see ${name})` } as Sample
  }
}

for (const route of ROUTES.filter((r) => !ONLY || ONLY.includes(r.name))) {
  test(route.name, async ({ browser }, testInfo) => {
    const use = testInfo.project.use as Record<string, any>
    const result: RouteResult = { name: route.name, path: route.path, cold: [], warm: [] }

    // one unrecorded load warms the server caches
    for (let i = -1; i < RUNS; i++) {
      // cold: new context, so empty HTTP cache, like a first visit
      const context = await newContext(browser, use)
      const page = await context.newPage()
      await page.addInitScript(initScript)
      await throttle(context, page)

      const cold = await load(page, route, false)
      // warm: hard reload with the HTTP cache filled, like refreshing the page
      const warm = await load(page, route, true)

      if (DEBUG && i === RUNS - 1) {
        fs.mkdirSync(OUT_DIR, { recursive: true })
        await page.screenshot({ path: path.join(OUT_DIR, `${route.name}.png`) })
      }
      await context.close()

      if (i >= 0) {
        result.cold.push(cold)
        result.warm.push(warm)
      }
    }

    fs.mkdirSync(PARTIAL_DIR, { recursive: true })
    fs.writeFileSync(path.join(PARTIAL_DIR, `${route.name}.json`), JSON.stringify(result))
    console.log(formatRow(route.name, summarize(result.cold), summarize(result.warm)))

    const errors = [...result.cold, ...result.warm].filter((s) => s.error)
    expect(
      errors.map((s) => s.error),
      'page loads that never became ready',
    ).toEqual([])
  })
}
