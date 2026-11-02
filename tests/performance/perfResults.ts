import path from 'path'

export const OUT_DIR = path.resolve('perf-results')
// one file per route while a run is in progress, merged by globalTeardown
export const PARTIAL_DIR = path.join(OUT_DIR, '.partial')

export interface Sample {
  // first contentful paint
  fcp: number | null
  // the full page loader was last hidden (app shell visible)
  shell: number | null
  // content ready (see routes.ts)
  ready: number
  requests: number
  apiRequests: number
  jsKB: number
  // same origin API requests that finished before ready (for waterfall analysis)
  api: { url: string; start: number; end: number }[]
  // set when the page never became ready
  error?: string
}

export interface RouteResult {
  name: string
  path: string
  cold: Sample[]
  warm: Sample[]
}

export interface Summary {
  shell: number
  ready: number
  min: number
  max: number
  api: number
  jsKB: number
  failed: number
}

const median = (values: number[]) => {
  if (!values.length) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export const summarize = (samples: Sample[]): Summary => {
  const ok = samples.filter((s) => !s.error)
  return {
    shell: Math.round(median(ok.map((s) => s.shell ?? s.ready))),
    ready: Math.round(median(ok.map((s) => s.ready))),
    min: Math.round(Math.min(...ok.map((s) => s.ready))),
    max: Math.round(Math.max(...ok.map((s) => s.ready))),
    api: Math.round(median(ok.map((s) => s.apiRequests))),
    jsKB: Math.round(median(ok.map((s) => s.jsKB))),
    failed: samples.length - ok.length,
  }
}

export const HEADER =
  'route              cold shell  cold ready (min-max)   warm shell  warm ready   api   js KB  failed'

export const formatRow = (name: string, cold: Summary, warm: Summary) =>
  [
    name.padEnd(18),
    String(cold.shell).padStart(10),
    String(cold.ready).padStart(11),
    `(${cold.min}-${cold.max})`.padEnd(11),
    String(warm.shell).padStart(11),
    String(warm.ready).padStart(11),
    String(cold.api).padStart(5),
    String(cold.jsKB).padStart(7),
    String(cold.failed + warm.failed).padStart(7),
  ].join(' ')
