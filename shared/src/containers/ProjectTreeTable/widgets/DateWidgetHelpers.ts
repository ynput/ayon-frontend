import { isValid, parseISO, subMilliseconds } from 'date-fns'
import { formatUTCDate } from '../../../util/formatUTCDate'

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
