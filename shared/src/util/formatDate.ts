import { format, isValid, parseISO } from 'date-fns'

// Absolute dates look the same everywhere: "22 Oct 2026", "22 Oct 2026, 22:43" (24h).
// Seconds only where they matter (event logs). Relative times ("2 hours ago") are not covered here.
export const DATE_FORMAT = 'd MMM yyyy'
export const TIME_FORMAT = 'HH:mm'
export const TIME_SECONDS_FORMAT = 'HH:mm:ss'

type DateValue = Date | string | number | null | undefined

interface TimeOptions {
  seconds?: boolean
}

const toDate = (value: DateValue): Date | null => {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return isValid(value) ? value : null
  // parseISO keeps a date-only string ("2026-10-22") on that day in every time zone
  const date = typeof value === 'string' ? parseISO(value) : new Date(value)
  if (isValid(date)) return date
  const fallback = new Date(value)
  return isValid(fallback) ? fallback : null
}

export const formatDate = (value: DateValue): string => {
  const date = toDate(value)
  return date ? format(date, DATE_FORMAT) : ''
}

export const formatTime = (value: DateValue, { seconds = false }: TimeOptions = {}): string => {
  const date = toDate(value)
  return date ? format(date, seconds ? TIME_SECONDS_FORMAT : TIME_FORMAT) : ''
}

export const formatDateTime = (value: DateValue, { seconds = false }: TimeOptions = {}): string => {
  const date = toDate(value)
  if (!date) return ''
  return format(date, `${DATE_FORMAT}, ${seconds ? TIME_SECONDS_FORMAT : TIME_FORMAT}`)
}
