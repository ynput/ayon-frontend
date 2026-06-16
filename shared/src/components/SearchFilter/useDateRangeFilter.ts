import { useRef, useState } from 'react'
import { Filter, SearchFilterRef } from '@ynput/ayon-react-components'
import { CUSTOM_RANGE_ID, CUSTOM_RANGE_ICON, detectRelativeDatePattern } from './filterDates'
import { startOfDay, endOfDay, format, parse } from 'date-fns'

export type DateRangeOption = {
  id: string
  label: string
  type?: string
  icon?: string | null
}

export type UseDateRangeFilterReturn = {
  // Dialog state
  customRangeFilterId: string | null
  customStartDate: string
  customEndDate: string
  setCustomStartDate: (v: string) => void
  setCustomEndDate: (v: string) => void

  /** Open the custom date range dialog for a given filter id. */
  openCustomRangeForFilter: (filterId: string, localFilters: Filter[]) => void
  /** Wrap around your own onChange: tracks new datetime filters and strips CUSTOM_RANGE_ID placeholders. */
  wrapFilterChange: (
    newFilters: Filter[],
    localFilters: Filter[],
    next: (cleaned: Filter[]) => void,
  ) => void
  /** Pass to pt.searchBar.onClickCapture to intercept datetime chip clicks. */
  handleSearchBarClickCapture: (e: React.MouseEvent<HTMLDivElement>, localFilters: Filter[]) => void
  /** Pass to pt.dropdown.pt.item.onClick to intercept "Custom range…" list item. */
  handleDropdownItemClick: (
    event: React.MouseEvent,
    localFilters: Filter[],
    options: DateRangeOption[],
  ) => boolean
  /** Call when the Dialog's Confirm button is clicked. */
  handleCustomRangeApply: (
    localFilters: Filter[],
    options: DateRangeOption[],
    onCommit: (updatedFilters: Filter[]) => void,
    searchFilterRef: React.RefObject<SearchFilterRef>,
  ) => void
  /** Call on Dialog close. */
  handleCustomRangeClose: () => void
}

/**
 * Encapsulates all custom date-range picker logic shared between SearchFilter wrappers.
 *
 * Usage:
 *   const dateRange = useDateRangeFilter()
 *   // wire dateRange.wrapFilterChange into your onChange
 *   // wire dateRange.handleSearchBarClickCapture / handleDropdownItemClick into pt
 *   // render <CustomDateRangeDialog {...dateRange} options={options} onApply={...} />
 */
export const useDateRangeFilter = (): UseDateRangeFilterReturn => {
  const [customRangeFilterId, setCustomRangeFilterId] = useState<string | null>(null)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Tracks the most recently activated datetime filter id
  const activeDatetimeFilterRef = useRef<string | null>(null)

  const openCustomRangeForFilter = (filterId: string, localFilters: Filter[]) => {
    const filter = localFilters.find((f) => f.id === filterId)
    if (filter?.type === 'datetime' && filter.values?.length) {
      const rangeValue = filter.values[0]
      if (rangeValue.id?.startsWith('custom-')) {
        const content = (rangeValue.id as string).replace('custom-', '')
        const firstZ = content.indexOf('Z')
        if (firstZ > 0) {
          const startISO = content.substring(0, firstZ + 1)
          const endISO = content.substring(firstZ + 2)
          if (startISO && endISO) {
            setCustomStartDate(
              format(parse(startISO, "yyyy-MM-dd'T'HH:mm:ss.SSSx", new Date()), 'yyyy-MM-dd'),
            )
            setCustomEndDate(
              format(parse(endISO, "yyyy-MM-dd'T'HH:mm:ss.SSSx", new Date()), 'yyyy-MM-dd'),
            )
            setCustomRangeFilterId(filterId)
            return
          }
        }
      }
    }
    setCustomRangeFilterId(filterId)
    setCustomStartDate('')
    setCustomEndDate('')
  }

  const findActiveDatetimeFilterId = (
    localFilters: Filter[],
    options: DateRangeOption[],
  ): string | null => {
    if (activeDatetimeFilterRef.current) return activeDatetimeFilterRef.current
    const datetimeFilters = localFilters.filter((f) => f.type === 'datetime')
    const empty = datetimeFilters.find((f) => !f.values?.length)
    if (empty) return empty.id
    if (datetimeFilters.length) return datetimeFilters[datetimeFilters.length - 1].id
    return options.find((o) => o.type === 'datetime')?.id ?? null
  }

  const wrapFilterChange = (
    newFilters: Filter[],
    localFilters: Filter[],
    next: (cleaned: Filter[]) => void,
  ) => {
    // Track newly added datetime filters
    const newDatetime = newFilters.find(
      (f) => f.type === 'datetime' && !localFilters.some((lf) => lf.id === f.id),
    )
    if (newDatetime) activeDatetimeFilterRef.current = newDatetime.id

    // Strip CUSTOM_RANGE_ID placeholder values that slip through, but keep empty
    // datetime filters so SearchFilter can maintain its intermediate state
    const cleaned = newFilters.map((f) => {
      if (f.type === 'datetime' && f.values?.some((v) => v.id === CUSTOM_RANGE_ID)) {
        return { ...f, values: f.values.filter((v) => v.id !== CUSTOM_RANGE_ID) }
      }
      return f
    })
    next(cleaned)
  }

  const handleSearchBarClickCapture = (
    e: React.MouseEvent<HTMLDivElement>,
    localFilters: Filter[],
  ) => {
    const target = e.target as HTMLElement
    if (target.closest('.remove') || target.closest('.button')) return
    const chipEl = target.closest('.search-filter-item')
    if (!chipEl) return

    const labelEl = chipEl.querySelector('.label')
    const chipLabel = labelEl?.textContent?.replace(/:$/, '').trim()
    if (!chipLabel) return

    const datetimeFilter = localFilters.find(
      (f) => f.type === 'datetime' && f.label === chipLabel && f.values?.length,
    )
    if (!datetimeFilter) return

    // Relative dates (Today, This week, etc.) — let the dropdown open normally
    const rangeValue = datetimeFilter.values?.[0]
    if (rangeValue?.id) {
      const content = (rangeValue.id as string).replace('custom-', '')
      const firstZ = content.indexOf('Z')
      if (firstZ > 0) {
        const startISO = content.substring(0, firstZ + 1)
        const endISO = content.substring(firstZ + 2)
        if (detectRelativeDatePattern(startISO, endISO)) return
      }
    }

    e.stopPropagation()
    openCustomRangeForFilter(datetimeFilter.id, localFilters)
  }

  const handleDropdownItemClick = (
    event: React.MouseEvent,
    localFilters: Filter[],
    options: DateRangeOption[],
  ): boolean => {
    const listItem = (event.target as HTMLElement).closest('li')
    if (!listItem) return true
    if (listItem.querySelector(`span[icon="${CUSTOM_RANGE_ICON}"]`)) {
      const filterId = findActiveDatetimeFilterId(localFilters, options)
      if (filterId) openCustomRangeForFilter(filterId, localFilters)
      return false
    }
    return true
  }

  const handleCustomRangeApply = (
    localFilters: Filter[],
    options: DateRangeOption[],
    onCommit: (updatedFilters: Filter[]) => void,
    searchFilterRef: React.RefObject<SearchFilterRef>,
  ) => {
    if (!customRangeFilterId || !customStartDate || !customEndDate) return
    const baseId = customRangeFilterId.split('__')[0]
    const filterOption = options.find((o) => o.id === baseId)
    if (!filterOption) return

    const start = startOfDay(parse(customStartDate, 'yyyy-MM-dd', new Date()))
    const end = endOfDay(parse(customEndDate, 'yyyy-MM-dd', new Date()))
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return

    const endFmt = end.getFullYear() === new Date().getFullYear() ? 'MMM d' : 'MMM d, yyyy'
    const dateValue = {
      id: `custom-${start.toISOString()}-${end.toISOString()}`,
      label: `${format(start, 'MMM d')} – ${format(end, endFmt)}`,
      values: [
        { id: start.toISOString(), label: format(start, 'MMM d, yyyy') },
        { id: end.toISOString(), label: format(end, 'MMM d, yyyy') },
      ],
    }

    const newFilter: Filter = {
      id: customRangeFilterId,
      type: 'datetime',
      label: filterOption.label,
      icon: filterOption.icon,
      values: [dateValue],
      singleSelect: true,
    }

    onCommit([...localFilters.filter((f) => f.id !== customRangeFilterId), newFilter])

    setCustomRangeFilterId(null)
    setCustomStartDate('')
    setCustomEndDate('')
    searchFilterRef.current?.close()
  }

  const handleCustomRangeClose = () => {
    setCustomRangeFilterId(null)
    setCustomStartDate('')
    setCustomEndDate('')
  }

  return {
    customRangeFilterId,
    customStartDate,
    customEndDate,
    setCustomStartDate,
    setCustomEndDate,
    openCustomRangeForFilter,
    wrapFilterChange,
    handleSearchBarClickCapture,
    handleDropdownItemClick,
    handleCustomRangeApply,
    handleCustomRangeClose,
  }
}
