import { Option } from '@ynput/ayon-react-components'
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  setHours,
  isSameDay,
  parseISO,
  isValid,
} from 'date-fns'

export const NO_DATE = 'no-date'

// Helper function to create date range arrays
const createDateRange = (startDate: Date, endDate: Date, startLabel: string, endLabel: string) => {
  return [
    { label: startLabel, id: startDate.toISOString() },
    { label: endLabel, id: endDate.toISOString() },
  ]
}

// first value is gte and second is lte
export const filterDateFunctions = {
  today: () => {
    const now = new Date()
    return createDateRange(startOfDay(now), endOfDay(now), 'Start of day', 'End of day')
  },
  yesterday: () => {
    const yesterday = subDays(new Date(), 1)
    return createDateRange(
      startOfDay(yesterday),
      endOfDay(yesterday),
      'Start of yesterday',
      'End of yesterday',
    )
  },
  ['after-now']: () => {
    const now = new Date()
    return [
      { label: 'After today', id: setHours(now, 24).toISOString() },
      { id: NO_DATE, label: NO_DATE },
    ]
  },
  ['before-now']: () => {
    const now = new Date()
    return [
      { id: NO_DATE, label: NO_DATE },
      { label: 'Before today', id: setHours(now, 0).toISOString() },
    ]
  },
  ['this-week']: () => {
    const now = new Date()
    return createDateRange(
      startOfWeek(now, { weekStartsOn: 0 }),
      endOfWeek(now, { weekStartsOn: 0 }),
      'Start of week',
      'End of week',
    )
  },
  ['next-week']: () => {
    const nextWeek = addWeeks(new Date(), 1)
    return createDateRange(
      startOfWeek(nextWeek, { weekStartsOn: 0 }),
      endOfWeek(nextWeek, { weekStartsOn: 0 }),
      'Start of next week',
      'End of next week',
    )
  },
  ['last-week']: () => {
    const lastWeek = subWeeks(new Date(), 1)
    return createDateRange(
      startOfWeek(lastWeek, { weekStartsOn: 0 }),
      endOfWeek(lastWeek, { weekStartsOn: 0 }),
      'Start of last week',
      'End of last week',
    )
  },
  ['this-month']: () => {
    const now = new Date()
    return createDateRange(startOfMonth(now), endOfMonth(now), 'Start of month', 'End of month')
  },
  ['next-month']: () => {
    const nextMonth = addMonths(new Date(), 1)
    return createDateRange(
      startOfMonth(nextMonth),
      endOfMonth(nextMonth),
      'Start of next month',
      'End of next month',
    )
  },
  ['last-month']: () => {
    const lastMonth = subMonths(new Date(), 1)
    return createDateRange(
      startOfMonth(lastMonth),
      endOfMonth(lastMonth),
      'Start of last month',
      'End of last month',
    )
  },
  ['this-year']: () => {
    const now = new Date()
    return createDateRange(startOfYear(now), endOfYear(now), 'Start of year', 'End of year')
  },
  ['last-year']: () => {
    const lastYear = subYears(new Date(), 1)
    return createDateRange(
      startOfYear(lastYear),
      endOfYear(lastYear),
      'Start of last year',
      'End of last year',
    )
  },
}

export type DateOptionType = keyof typeof filterDateFunctions

export const CUSTOM_RANGE_ID = 'custom-range'
export const CUSTOM_RANGE_ICON = 'tune'

// Custom range is free (no PowerPack needed), listed first
export const customRangeOption: Option & { id: typeof CUSTOM_RANGE_ID } = {
  id: CUSTOM_RANGE_ID,
  label: 'Custom range...',
  values: [],
  icon: CUSTOM_RANGE_ICON,
}

// Function to generate date preset options dynamically (recalculates on each call)
// This ensures relative dates like "Today" always reflect the current date
export const generateDatePresetOptions = (): (Option & { id: DateOptionType })[] => [
  {
    id: 'today',
    label: 'Today',
    values: filterDateFunctions.today(),
    icon: 'today',
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    values: filterDateFunctions.yesterday(),
    icon: 'date_range',
  },
  {
    id: 'after-now',
    label: 'After today',
    values: filterDateFunctions['after-now'](),
    icon: 'event_upcoming',
  },
  {
    id: 'before-now',
    label: 'Before today',
    values: filterDateFunctions['before-now'](),
    icon: 'event_busy',
  },
  {
    id: 'this-week',
    label: 'This week',
    values: filterDateFunctions['this-week'](),
    icon: 'date_range',
  },
  {
    id: 'last-week',
    label: 'Last week',
    values: filterDateFunctions['last-week'](),
    icon: 'date_range',
  },
  {
    id: 'this-month',
    label: 'This month',
    values: filterDateFunctions['this-month'](),
    icon: 'calendar_month',
  },
  {
    id: 'last-month',
    label: 'Last month',
    values: filterDateFunctions['last-month'](),
    icon: 'calendar_month',
  },
  {
    id: 'this-year',
    label: 'This year',
    values: filterDateFunctions['this-year'](),
    icon: 'calendar_month',
  },
  {
    id: 'last-year',
    label: 'Last year',
    values: filterDateFunctions['last-year'](),
    icon: 'calendar_month',
  },
]

// Deprecated: kept for backwards compatibility only
// Use generateDatePresetOptions() instead to get fresh presets on each render
export const datePresetOptions: (Option & { id: DateOptionType })[] = generateDatePresetOptions()

// Function to generate combined list dynamically
export const generateDateOptions = (): (Option & { id: DateOptionType | typeof CUSTOM_RANGE_ID })[] => [
  customRangeOption,
  ...generateDatePresetOptions(),
]

// Deprecated: kept for backwards compatibility only
// Use generateDateOptions() instead
export const dateOptions: (Option & { id: DateOptionType | typeof CUSTOM_RANGE_ID })[] = generateDateOptions()

/**
 * Detects if a date range matches a known relative pattern (Today, This week, etc.)
 * Returns the pattern info if matched, null otherwise
 */
export const detectRelativeDatePattern = (
  startISO: string | undefined,
  endISO: string | undefined,
): { label: string; id: DateOptionType } | null => {
  if (!startISO || !endISO) return null

  try {
    const startDate = parseISO(startISO)
    const endDate = parseISO(endISO)

    if (!isValid(startDate) || !isValid(endDate)) return null

    // Check against each relative pattern
    const patterns: Array<{ id: DateOptionType; label: string; check: () => boolean }> = [
      {
        id: 'today',
        label: 'Today',
        check: () => {
          const today = filterDateFunctions.today()
          return (
            isSameDay(startDate, parseISO(today[0].id)) && isSameDay(endDate, parseISO(today[1].id))
          )
        },
      },
      {
        id: 'yesterday',
        label: 'Yesterday',
        check: () => {
          const yesterday = filterDateFunctions.yesterday()
          return (
            isSameDay(startDate, parseISO(yesterday[0].id)) &&
            isSameDay(endDate, parseISO(yesterday[1].id))
          )
        },
      },
      {
        id: 'this-week',
        label: 'This week',
        check: () => {
          const thisWeek = filterDateFunctions['this-week']()
          return (
            isSameDay(startDate, parseISO(thisWeek[0].id)) &&
            isSameDay(endDate, parseISO(thisWeek[1].id))
          )
        },
      },
      {
        id: 'last-week',
        label: 'Last week',
        check: () => {
          const lastWeek = filterDateFunctions['last-week']()
          return (
            isSameDay(startDate, parseISO(lastWeek[0].id)) &&
            isSameDay(endDate, parseISO(lastWeek[1].id))
          )
        },
      },
      {
        id: 'this-month',
        label: 'This month',
        check: () => {
          const thisMonth = filterDateFunctions['this-month']()
          return (
            isSameDay(startDate, parseISO(thisMonth[0].id)) &&
            isSameDay(endDate, parseISO(thisMonth[1].id))
          )
        },
      },
      {
        id: 'last-month',
        label: 'Last month',
        check: () => {
          const lastMonth = filterDateFunctions['last-month']()
          return (
            isSameDay(startDate, parseISO(lastMonth[0].id)) &&
            isSameDay(endDate, parseISO(lastMonth[1].id))
          )
        },
      },
      {
        id: 'this-year',
        label: 'This year',
        check: () => {
          const thisYear = filterDateFunctions['this-year']()
          return (
            isSameDay(startDate, parseISO(thisYear[0].id)) &&
            isSameDay(endDate, parseISO(thisYear[1].id))
          )
        },
      },
      {
        id: 'last-year',
        label: 'Last year',
        check: () => {
          const lastYear = filterDateFunctions['last-year']()
          return (
            isSameDay(startDate, parseISO(lastYear[0].id)) &&
            isSameDay(endDate, parseISO(lastYear[1].id))
          )
        },
      },
    ]

    for (const pattern of patterns) {
      if (pattern.check()) {
        return { label: pattern.label, id: pattern.id }
      }
    }

    return null
  } catch {
    return null
  }
}
