import { format, isValid, parse, parseISO, subMilliseconds } from 'date-fns'
import { formatUTCDate } from '../../../util/formatUTCDate'
import { DATE_FORMAT } from '../../../util/formatDate'

/** the day of a date value, `YYYY-MM-DD`; a midnight-exclusive end is the day before */
export const toDay = (value: string | undefined, isMidnightExclusive = false) => {
  const date = value ? parseISO(value) : undefined
  if (!date || !isValid(date)) return ''
  return formatUTCDate(isMidnightExclusive ? subMilliseconds(date, 1) : date, 'yyyy-MM-dd')
}

/** a day (`YYYY-MM-DD`) as a date value: midnight UTC, or the next one for a midnight-exclusive end */
export const fromDay = (day: string, isMidnightExclusive = false) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + Number(isMidnightExclusive))).toISOString()
}

/** a day as the cell shows it and the input starts with: "17 Nov 2026" */
export const formatDay = (day: string) => (day ? format(parseISO(day), DATE_FORMAT) : '')

// day first, as the cell shows it; a year left out is this year
const TYPED_FORMATS = [
  'yyyy-MM-dd',
  DATE_FORMAT,
  'd MMMM yyyy',
  'd MMM yy',
  'd MMM',
  'd MMMM',
  ...['/', '-', '.'].flatMap((sep) => [`d${sep}M${sep}yyyy`, `d${sep}M${sep}yy`, `d${sep}M`]),
]

/** a date typed in a cell as a day (`YYYY-MM-DD`), or null when it is not one */
export const parseTypedDay = (text: string, today = new Date()): string | null => {
  const typed = text.trim().replace(/\s+/g, ' ')
  if (!typed) return null
  for (const pattern of TYPED_FORMATS) {
    const date = parse(typed, pattern, today)
    // "1/2/26" read as the year 26 is the two-digit year's pattern, further on
    if (isValid(date) && date.getFullYear() >= 1000) return format(date, 'yyyy-MM-dd')
  }
  return null
}
