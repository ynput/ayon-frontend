import type { Option } from '@ynput/ayon-react-components'
import {
  customRangeOption,
  DateOptionType,
  filterDateFunctions,
  generateDatePresetOptions,
} from '@shared/components/SearchFilter/filterDates'
import type { EventFilters } from '../types'

const HOUR = 3600_000

export const ROLLING_DATE_PRESETS = [
  { id: '1h', short: '1h', label: 'Last hour', span: HOUR },
  { id: '24h', short: '24h', label: 'Last 24 hours', span: 24 * HOUR },
  { id: '7d', short: '7d', label: 'Last 7 days', span: 7 * 24 * HOUR },
  { id: '30d', short: '30d', label: 'Last 30 days', span: 30 * 24 * HOUR },
]

// events are never in the future
const CALENDAR_PRESET_IDS = [
  'today',
  'yesterday',
  'this-week',
  'last-week',
  'this-month',
  'last-month',
  'this-year',
  'last-year',
]

export const isDatePreset = (id?: string) =>
  !!id && (CALENDAR_PRESET_IDS.includes(id) || ROLLING_DATE_PRESETS.some((p) => p.id === id))

export const getDateOptions = (): Option[] => [
  customRangeOption,
  ...ROLLING_DATE_PRESETS.map(({ id, label }) => ({ id, label, icon: 'schedule', values: [] })),
  ...generateDatePresetOptions().filter((o) => CALENDAR_PRESET_IDS.includes(o.id)),
]

/** The filters the server understands: a date preset becomes the range it means right now */
export const resolveEventFilters = ({ datePreset, ...filters }: EventFilters): EventFilters => {
  if (!datePreset) return filters
  const rolling = ROLLING_DATE_PRESETS.find((p) => p.id === datePreset)
  if (rolling) return { ...filters, newerThan: new Date(Date.now() - rolling.span).toISOString() }
  if (!CALENDAR_PRESET_IDS.includes(datePreset)) return filters
  const [start, end] = filterDateFunctions[datePreset as DateOptionType]()
  return { ...filters, newerThan: start.id, olderThan: end.id }
}
