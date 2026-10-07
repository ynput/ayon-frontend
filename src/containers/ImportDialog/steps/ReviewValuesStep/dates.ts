// Dates in a sheet come in many formats. They are converted to ISO in the review step,
// so the user sees how each one was read before importing.

export type DateOrder = 'dmy' | 'mdy'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/
const YEAR_FIRST = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
const YEAR_LAST =
  /^(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/

const pad = (n: number) => String(n).padStart(2, '0')

const fullYear = (year: string) => {
  const n = Number(year)
  if (year.length === 4) return n
  return n < 70 ? 2000 + n : 1900 + n
}

const toIso = (
  year: number,
  month: number,
  day: number,
  hours?: string,
  minutes?: string,
  seconds?: string,
) => {
  // Date rolls over invalid days (31.2. becomes 3.3.), so check it kept them
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  const iso = `${year}-${pad(month)}-${pad(day)}`
  if (hours === undefined) return iso
  if (Number(hours) > 23 || Number(minutes) > 59 || Number(seconds ?? 0) > 59) return null
  return `${iso}T${pad(Number(hours))}:${minutes}:${pad(Number(seconds ?? 0))}`
}

export const isIsoDate = (value: string) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))

// Returns the date as ISO, or null when it can't be read
export const parseDate = (raw: string, order: DateOrder): string | null => {
  const value = raw.trim()
  if (isIsoDate(value)) return value

  const yearFirst = value.match(YEAR_FIRST)
  if (yearFirst) {
    const [, year, month, day, hours, minutes, seconds] = yearFirst
    return toIso(Number(year), Number(month), Number(day), hours, minutes, seconds)
  }

  const yearLast = value.match(YEAR_LAST)
  if (yearLast) {
    const [, first, second, year, hours, minutes, seconds] = yearLast
    const [day, month] = order === 'dmy' ? [first, second] : [second, first]
    return toIso(fullYear(year), Number(month), Number(day), hours, minutes, seconds)
  }

  // month names, e.g. "10 Jan 2026" or "January 10, 2026"
  if (/[a-z]/i.test(value) && /\d{4}/.test(value)) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    const hasTime = /\d:\d/.test(value)
    return toIso(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      hasTime ? String(date.getHours()) : undefined,
      hasTime ? pad(date.getMinutes()) : undefined,
      hasTime ? String(date.getSeconds()) : undefined,
    )
  }

  return null
}

export const localeDateOrder = (): DateOrder => {
  const parts = new Intl.DateTimeFormat().formatToParts(new Date(2026, 10, 22))
  const first = parts.find(({ type }) => type === 'day' || type === 'month')
  return first?.type === 'month' ? 'mdy' : 'dmy'
}

export type DateOrderDetection = {
  order: DateOrder
  // some values like 10/1/2026 could be read both ways
  hasDayMonthValues: boolean
  // no value tells the order, e.g. 13/1/2026 can only be day first
  ambiguous: boolean
}

// Works out whether a column's day.month.year values put the day or the month first.
export const detectDateOrder = (values: (string | undefined)[]): DateOrderDetection => {
  let dayFirstVotes = 0
  let monthFirstVotes = 0
  let hasDayMonthValues = false
  let allDots = true

  for (const value of values) {
    const match = value?.trim().match(YEAR_LAST)
    if (!match) continue
    const [, first, second] = match
    hasDayMonthValues = true
    if (!value!.includes('.')) allDots = false
    if (Number(first) > 12) dayFirstVotes++
    if (Number(second) > 12) monthFirstVotes++
  }

  if (dayFirstVotes || monthFirstVotes) {
    return {
      order: dayFirstVotes >= monthFirstVotes ? 'dmy' : 'mdy',
      hasDayMonthValues,
      ambiguous: false,
    }
  }

  // 10.1.2026 is day first wherever dots are used, slashes depend on the locale
  return {
    order: allDots ? 'dmy' : localeDateOrder(),
    hasDayMonthValues,
    ambiguous: hasDayMonthValues,
  }
}

export const formatDateOrderExample = (order: DateOrder) =>
  order === 'dmy' ? '10/1/2026 is 10 January' : '10/1/2026 is October 1'
