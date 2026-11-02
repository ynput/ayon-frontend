#!/usr/bin/env node
// Compares two page load benchmark reports: node tests/performance/compare.mjs <before.json> [after.json]
// `after` defaults to perf-results/latest.json.
import fs from 'fs'

const [beforeFile, afterFile = 'perf-results/latest.json'] = process.argv.slice(2)
if (!beforeFile) {
  console.error('usage: node tests/performance/compare.mjs <before.json> [after.json]')
  process.exit(1)
}

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const before = read(beforeFile)
const after = read(afterFile)
const byName = Object.fromEntries(before.summary.map((s) => [s.name, s]))

const delta = (a, b) => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'n/a'.padStart(16)
  const pct = a ? Math.round(((b - a) / a) * 100) : 0
  return `${a}→${b} (${pct > 0 ? '+' : ''}${pct}%)`.padStart(22)
}

console.log(`before: ${before.label} ${before.date}`)
console.log(`after:  ${after.label} ${after.date}\n`)
console.log(
  'route'.padEnd(18) +
    'cold ready'.padStart(22) +
    'warm ready'.padStart(22) +
    'cold shell'.padStart(22) +
    'api'.padStart(12) +
    'js KB'.padStart(18),
)
for (const s of after.summary) {
  const b = byName[s.name]
  if (!b) continue
  console.log(
    s.name.padEnd(18) +
      delta(b.cold.ready, s.cold.ready) +
      delta(b.warm.ready, s.warm.ready) +
      delta(b.cold.shell, s.cold.shell) +
      `${b.cold.api}→${s.cold.api}`.padStart(12) +
      `${b.cold.jsKB}→${s.cold.jsKB}`.padStart(18),
  )
}
