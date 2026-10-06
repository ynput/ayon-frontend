import fs from 'fs'
import path from 'path'
import { ROUTES } from './routes'
import { HEADER, OUT_DIR, PARTIAL_DIR, RouteResult, formatRow, summarize } from './perfResults'

/** Merges the per-route results of this run into perf-results/<label>-<date>.json and latest.json */
export default async function globalTeardown() {
  if (!fs.existsSync(PARTIAL_DIR)) return
  const order = ROUTES.map((r) => r.name)
  const results: RouteResult[] = fs
    .readdirSync(PARTIAL_DIR)
    .map((file) => JSON.parse(fs.readFileSync(path.join(PARTIAL_DIR, file), 'utf8')))
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
  fs.rmSync(PARTIAL_DIR, { recursive: true, force: true })
  if (!results.length) return

  const summary = results.map((r) => ({
    name: r.name,
    path: r.path,
    cold: summarize(r.cold),
    warm: summarize(r.warm),
  }))
  const report = {
    label: process.env.PERF_LABEL || 'run',
    date: new Date().toISOString(),
    settings: {
      runs: Number(process.env.PERF_RUNS || 5),
      latency: Number(process.env.PERF_LATENCY || 0),
      cpu: Number(process.env.PERF_CPU || 1),
      mode: process.env.PERF_BASE_URL ? 'external' : process.env.PERF_MODE || 'preview',
    },
    summary,
    results,
  }

  const stamp = report.date.replace(/[:.]/g, '-')
  const file = path.join(OUT_DIR, `${report.label}-${stamp}.json`)
  fs.writeFileSync(file, JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(OUT_DIR, 'latest.json'), JSON.stringify(report, null, 2))

  console.log(`\nPage load times in ms, medians of ${report.settings.runs} runs (${file})`)
  console.log(HEADER)
  for (const s of summary) console.log(formatRow(s.name, s.cold, s.warm))
}
