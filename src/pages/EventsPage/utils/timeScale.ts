import { addDays, addMonths, format, startOfDay, startOfMonth } from 'date-fns'

const S = 1000
const M = 60 * S
const H = 60 * M
const D = 24 * H

export const MIN_MS_PER_PX = 20 // ~ 1 second per 50px
export const MAX_MS_PER_PX = 2 * D // a couple of years across a wide screen

const INTERVALS = [
  S,
  5 * S,
  15 * S,
  30 * S,
  M,
  5 * M,
  15 * M,
  30 * M,
  H,
  3 * H,
  6 * H,
  12 * H,
  D,
  2 * D,
  7 * D,
  30 * D,
  91 * D,
  365 * D,
]

export const clampScale = (msPerPx: number) =>
  Math.min(MAX_MS_PER_PX, Math.max(MIN_MS_PER_PX, msPerPx))

export type Tick = { time: number; label: string; major: boolean }

/** Picks the smallest interval that keeps labels at least `minPx` apart */
export const getTickInterval = (msPerPx: number, minPx = 96) =>
  INTERVALS.find((interval) => interval / msPerPx >= minPx) ?? INTERVALS[INTERVALS.length - 1]

const formatTick = (time: number, interval: number) => {
  if (interval < M) return format(time, 'HH:mm:ss')
  if (interval < D) return format(time, 'HH:mm')
  if (interval < 30 * D) return format(time, 'EEE d MMM')
  if (interval < 365 * D) return format(time, 'MMM yyyy')
  return format(time, 'yyyy')
}

/** Ticks aligned to local time so labels land on round values */
export const getTicks = (start: number, end: number, msPerPx: number): Tick[] => {
  const interval = getTickInterval(msPerPx)
  const ticks: Tick[] = []

  if (interval >= 30 * D) {
    const months = interval >= 365 * D ? 12 : interval >= 91 * D ? 3 : 1
    const first = startOfMonth(start)
    // align quarters and years to calendar boundaries
    first.setMonth(first.getMonth() - (first.getMonth() % months))
    for (let t = first.getTime(); t <= end; t = addMonths(t, months).getTime()) {
      const month = new Date(t).getMonth()
      ticks.push({ time: t, label: formatTick(t, interval), major: month === 0 })
    }
    return ticks
  }

  if (interval >= D) {
    const days = interval / D
    for (let t = startOfDay(start).getTime(); t <= end; t = addDays(t, days).getTime()) {
      ticks.push({ time: t, label: formatTick(t, interval), major: true })
    }
    return ticks
  }

  // sub-day intervals: align to the local day so DST and timezone offsets stay correct
  const dayStart = startOfDay(start).getTime()
  let t = dayStart + Math.floor((start - dayStart) / interval) * interval
  for (; t <= end; t += interval) {
    const local = new Date(t)
    const isMidnight =
      local.getHours() === 0 && local.getMinutes() === 0 && local.getSeconds() === 0
    ticks.push({ time: t, label: formatTick(t, interval), major: isMidnight })
  }
  return ticks
}

/** Day boundaries inside the range, shown as a context row for sub-day zoom levels */
export const getDayMarkers = (start: number, end: number, msPerPx: number) => {
  if (getTickInterval(msPerPx) >= D) return []
  const markers: { time: number; label: string }[] = []
  for (let t = startOfDay(start).getTime(); t <= end; t = addDays(t, 1).getTime()) {
    markers.push({ time: t, label: format(t, 'EEEE d MMMM yyyy') })
  }
  return markers
}

export const ZOOM_PRESETS: { label: string; span: number }[] = [
  { label: '5m', span: 5 * M },
  { label: '1h', span: H },
  { label: '6h', span: 6 * H },
  { label: '1d', span: D },
  { label: '1w', span: 7 * D },
  { label: '1mo', span: 30 * D },
  { label: '1y', span: 365 * D },
]

/** Bucket size used for the density histogram, scaled with zoom */
export const getHistogramBucket = (msPerPx: number) => getTickInterval(msPerPx, 8)

export const formatSpan = (ms: number) => {
  if (ms < M) return `${Math.round(ms / S)}s`
  if (ms < H) return `${Math.round(ms / M)}m`
  if (ms < D) return `${+(ms / H).toFixed(1)}h`
  return `${+(ms / D).toFixed(1)}d`
}
