import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  isWeekend,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** A span of the calendar on the axis, `start` and `end` in epoch ms, `short` when `label` does not fit */
export type AxisCell = {
  start: number
  end: number
  label: string
  short?: string
  weekend?: boolean
}

/** Two rows, like the planner: the larger unit above the cells it holds. `clock`: the cells are times */
export type TimeAxis = { primary: AxisCell[]; secondary: AxisCell[]; clock: boolean }

type Unit = {
  floor: (time: number) => number
  next: (time: number) => number
  /** `px`: width of the cell, longer labels when they fit */
  label: (time: number, px: number) => string
  short?: (time: number) => string
}

type Tier = Unit & {
  /** typical length of a cell, to pick the tier whose cells are wide enough */
  size: number
  minPx: number
  primary?: Unit
}

// steps of the local clock, so the cells stay on round times across daylight saving changes
const clockUnit = (step: number, part: 'minutes' | 'hours'): Unit => ({
  floor: (time) => {
    const date = new Date(time)
    if (part === 'minutes') date.setMinutes(Math.floor(date.getMinutes() / step) * step, 0, 0)
    else date.setHours(Math.floor(date.getHours() / step) * step, 0, 0, 0)
    return date.getTime()
  },
  next: (time) => {
    const date = new Date(time)
    if (part === 'minutes') date.setMinutes(date.getMinutes() + step)
    else date.setHours(date.getHours() + step)
    return date.getTime()
  },
  label: (time) => format(time, 'HH:mm'),
})

const day: Unit = {
  floor: (time) => startOfDay(time).getTime(),
  next: (time) => addDays(time, 1).getTime(),
  label: (time, px) => format(time, px >= 56 ? 'EEE d' : 'd'),
}

const days: Unit = {
  ...day,
  label: (time) => format(time, 'EEE d MMMM yyyy'),
  short: (time) => format(time, 'd MMM'),
}

const week: Unit = {
  floor: (time) => startOfWeek(time, { weekStartsOn: 1 }).getTime(),
  next: (time) => addWeeks(time, 1).getTime(),
  label: (time, px) => format(time, px >= 56 ? 'd MMM' : 'd'),
}

const month: Unit = {
  floor: (time) => startOfMonth(time).getTime(),
  next: (time) => addMonths(time, 1).getTime(),
  label: (time) => format(time, 'MMM'),
}

const months: Unit = {
  ...month,
  label: (time) => format(time, 'MMMM yyyy'),
  short: (time) => format(time, 'MMM'),
}

const year: Unit = {
  floor: (time) => startOfYear(time).getTime(),
  next: (time) => addYears(time, 1).getTime(),
  label: (time) => format(time, 'yyyy'),
}

const clockTier = (step: number, part: 'minutes' | 'hours'): Tier => ({
  ...clockUnit(step, part),
  size: step * (part === 'minutes' ? MINUTE : HOUR),
  // days read better than halves or quarters of them until a day is wide
  minPx: part === 'minutes' ? 44 : 64,
  primary: days,
})

/** Smallest first, the first whose cells are wide enough is used */
const TIERS: Tier[] = [
  clockTier(1, 'minutes'),
  clockTier(5, 'minutes'),
  clockTier(15, 'minutes'),
  clockTier(30, 'minutes'),
  clockTier(1, 'hours'),
  clockTier(3, 'hours'),
  clockTier(6, 'hours'),
  clockTier(12, 'hours'),
  { ...day, size: DAY, minPx: 24, primary: months },
  { ...week, size: 7 * DAY, minPx: 30, primary: months },
  { ...month, size: 30 * DAY, minPx: 32, primary: year },
  { ...year, size: 365 * DAY, minPx: 36 },
]

const getCells = (unit: Unit, start: number, end: number, msPerPx: number, weekends = false) => {
  const cells: AxisCell[] = []
  for (let time = unit.floor(start); time < end; ) {
    const next = unit.next(time)
    cells.push({
      start: time,
      end: next,
      label: unit.label(time, (next - time) / msPerPx),
      ...(unit.short && { short: unit.short(time) }),
      ...(weekends && isWeekend(time) && { weekend: true }),
    })
    time = next
  }
  return cells
}

/**
 * The calendar cells between `start` and `end`. They are aligned to the calendar (local clock, days,
 * weeks from Monday, months, years), so they stay put while the view pans and zooms.
 */
export const getTimeAxis = (start: number, end: number, msPerPx: number): TimeAxis => {
  const tier = TIERS.find((t) => t.size / msPerPx >= t.minPx) ?? TIERS[TIERS.length - 1]
  return {
    primary: tier.primary ? getCells(tier.primary, start, end, msPerPx) : [],
    secondary: getCells(tier, start, end, msPerPx, tier.size === DAY),
    clock: tier.size < DAY,
  }
}
