import type { EventItem, Severity } from '../../types'
import { getCategory, getSeverity } from '../../utils/eventMeta'

export const CLUSTER_PX = 12

export type Lane = {
  id: string
  /** ascending by time */
  events: EventItem[]
}

export type Cluster = {
  key: string
  lane: string
  x: number
  width: number
  events: EventItem[]
  severity: Severity | null
  hasActive: boolean
}

const SEVERITY_RANK: Record<Severity, number> = { error: 3, warning: 2, info: 1, debug: 0 }

export const worstSeverity = (events: EventItem[]): Severity | null => {
  let worst: Severity | null = null
  for (const e of events) {
    const s = getSeverity(e)
    if (s && (!worst || SEVERITY_RANK[s] > SEVERITY_RANK[worst])) worst = s
  }
  return worst
}

/** Lanes ordered by volume, logs always last so they don't push domain events down */
export const buildLanes = (events: EventItem[]): Lane[] => {
  const byCategory = new Map<string, EventItem[]>()
  // events arrive newest first, iterate backwards to get ascending lanes for binary search
  for (let i = events.length - 1; i >= 0; i--) {
    const category = getCategory(events[i].topic)
    let list = byCategory.get(category)
    if (!list) byCategory.set(category, (list = []))
    list.push(events[i])
  }
  return [...byCategory.entries()]
    .map(([id, list]) => ({ id, events: list }))
    .sort((a, b) => {
      if (a.id === 'log') return 1
      if (b.id === 'log') return -1
      return b.events.length - a.events.length
    })
}

/** first index with createdAt >= time */
export const lowerBound = (list: EventItem[], time: number) => {
  let lo = 0
  let hi = list.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (list[mid].createdAt < time) lo = mid + 1
    else hi = mid
  }
  return lo
}

const MARKER_GAP = 3

/** Rendered width of a mark, clusters grow with their time span and their count label */
export const getMarkerWidth = (count: number, spanPx: number) =>
  count === 1 ? 10 : Math.max(18, spanPx + 18, String(count).length * 7 + 10)

/** Marks are drawn centred on their first event */
export const getMarkerOffset = (count: number) => (count === 1 ? 5 : 9)

/**
 * Groups events closer than CLUSTER_PX into one mark so dense sections stay readable,
 * only events inside the visible range are processed.
 */
export const clusterLane = (lane: Lane, start: number, end: number, msPerPx: number): Cluster[] => {
  const pad = CLUSTER_PX * msPerPx
  const from = lowerBound(lane.events, start - pad)
  const to = lowerBound(lane.events, end + pad)
  const clusters: Cluster[] = []
  let current: EventItem[] = []
  let firstX = 0
  let lastX = 0

  const flush = () => {
    if (!current.length) return
    clusters.push({
      key: `${lane.id}-${current[0].id}`,
      lane: lane.id,
      x: firstX,
      width: lastX - firstX,
      events: current,
      severity: worstSeverity(current),
      hasActive: current.some((e) => e.status === 'pending' || e.status === 'in_progress'),
    })
    current = []
  }

  for (let i = from; i < to; i++) {
    const event = lane.events[i]
    const x = (event.createdAt - start) / msPerPx
    if (current.length && x - lastX > CLUSTER_PX) {
      // keep merging while the next mark would overlap the current one's label
      const count = current.length
      const right = firstX - getMarkerOffset(count) + getMarkerWidth(count, lastX - firstX)
      if (x - getMarkerOffset(1) > right + MARKER_GAP) flush()
    }
    if (!current.length) firstX = x
    lastX = x
    current.push(event)
  }
  flush()
  return clusters
}

export type HistogramBar = { time: number; x: number; width: number; count: number; errors: number }

export const buildHistogram = (
  lanes: Lane[],
  start: number,
  end: number,
  msPerPx: number,
  bucket: number,
): HistogramBar[] => {
  const first = Math.floor(start / bucket) * bucket
  const buckets = new Map<number, HistogramBar>()
  for (const lane of lanes) {
    const from = lowerBound(lane.events, first)
    const to = lowerBound(lane.events, end + bucket)
    for (let i = from; i < to; i++) {
      const event = lane.events[i]
      const time = Math.floor(event.createdAt / bucket) * bucket
      let bar = buckets.get(time)
      if (!bar) {
        bar = { time, x: (time - start) / msPerPx, width: bucket / msPerPx, count: 0, errors: 0 }
        buckets.set(time, bar)
      }
      bar.count++
      if (getSeverity(event) === 'error') bar.errors++
    }
  }
  return [...buckets.values()]
}
