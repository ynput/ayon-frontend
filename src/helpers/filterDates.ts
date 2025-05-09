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

export const dateOptions: (Option & { id: DateOptionType })[] = [
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
