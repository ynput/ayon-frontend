import styled from 'styled-components'
import { BuildFilterOptions, useBuildFilterOptions, ScopeWithFilterTypes } from '@shared/components'
import { FC, useMemo, useState, useEffect, useRef } from 'react'
import {
  Dialog,
  Filter,
  FormRow,
  Icon,
  InputDate,
  SaveButton,
  SearchFilter,
  SearchFilterProps,
  SearchFilterRef,
  SEARCH_FILTER_ID,
  buildFilterId,
} from '@ynput/ayon-react-components'
import { EditorTaskNode, TaskNodeMap } from '@shared/containers/ProjectTreeTable'
import AdvancedFiltersPlaceholder from '@components/SearchFilter/AdvancedFiltersPlaceholder'
import { ProjectModelWithProducts, usePowerpack } from '@shared/context'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  queryFilterToClientFilter,
  clientFilterToQueryFilter,
} from '@shared/containers/ProjectTreeTable/utils'
import {
  CUSTOM_RANGE_ID,
  CUSTOM_RANGE_ICON,
  detectRelativeDatePattern,
} from '@shared/components/SearchFilter/filterDates'
import { startOfDay, endOfDay, format, parse } from 'date-fns'

const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

interface SearchFilterWrapperProps
  extends Omit<BuildFilterOptions, 'scope' | 'scopes' | 'data' | 'power'>,
    Omit<SearchFilterProps, 'options' | 'onFinish' | 'filters' | 'onChange'> {
  projectInfo?: ProjectModelWithProducts
  tasksMap?: TaskNodeMap
  scope?: BuildFilterOptions['scope']
  scopes?: ScopeWithFilterTypes[]
  queryFilters?: QueryFilter
  onChange?: (queryFilters: QueryFilter) => void
  data: BuildFilterOptions['data']
}

const SearchFilterWrapper: FC<SearchFilterWrapperProps> = ({
  queryFilters,
  onChange,
  data: customData,
  filterTypes,
  projectNames,
  disabledFilters,
  projectInfo,
  tasksMap,
  scope,
  scopes,
  config,
  pt,
  ...props
}) => {
  const { columnOrder } = useColumnSettingsContext()

  // create a flat list of all the assignees (string[]) on all tasks (duplicated)
  // this is used to rank what assignees are shown in the filter first
  const allAssignees: string[] = useMemo(
    () =>
      tasksMap
        ? Array.from(tasksMap.values()).flatMap((task: EditorTaskNode) => task.assignees)
        : [],
    [tasksMap],
  )

  // build the data for the suggested options
  const data: BuildFilterOptions['data'] = {
    assignees: allAssignees,
    tags: projectInfo?.tags?.map((t) => t.name) || [],
    productTypes: projectInfo?.productTypes,
    ...customData,
    // TODO: find a way of getting all attribute values when all tasks are not loaded
  }

  const { setPowerpackDialog, powerLicense } = usePowerpack()
  const handlePowerClick = () => {
    setPowerpackDialog('advancedFilters')
    return false
  }

  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope,
    scopes,
    data,
    columnOrder,
    config: {
      enableExcludes: powerLicense,
      enableOperatorChange: powerLicense,
      enableRelativeValues: true,
      prefixes: { attributes: 'attrib.' },
      ...config,
    },
    power: powerLicense,
  })

  // Convert QueryFilter to Filter[] for internal use
  const filters = queryFilterToClientFilter(queryFilters, options)

  // keeps track of the filters whilst adding/removing filters
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)

  const searchFilterRef = useRef<SearchFilterRef>(null)

  // Custom date range picker state
  const [customRangeFilterId, setCustomRangeFilterId] = useState<string | null>(null)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Track which datetime filter the user is currently interacting with
  const activeDatetimeFilterRef = useRef<string | null>(null)
  const lastInteractedFilterRef = useRef<string | null>(null)

  // Active search-chip edit: set when user clicks a search chip to edit it.
  // The dropdown opens in edit mode; our Enter interceptor updates/removes the chip.
  const editingSearchChipRef = useRef<string | null>(null)

  // Mirror of localFilters for use inside async DOM event handlers (keydown on
  // the dropdown input) that need the latest filters without stale closures.
  const localFiltersRef = useRef<Filter[]>(localFilters)
  localFiltersRef.current = localFilters

  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)]) // Update filters when filters change

  // Track the active datetime filter from onChange events
  const handleFilterChange = (newFilters: Filter[]) => {
    // Track the most recently added/modified datetime filter
    const datetimeFilter = newFilters.find(
      (f) => f.type === 'datetime' && !localFilters.some((lf) => lf.id === f.id),
    )
    if (datetimeFilter) {
      activeDatetimeFilterRef.current = datetimeFilter.id
    }

    // Check if a relative date filter is being clicked to edit it
    // If so, auto-open the edit dialog instead of allowing dropdown
    const modifiedDatetimeFilter = newFilters.find((f) => f.type === 'datetime' && f.id !== lastInteractedFilterRef.current)
    if (modifiedDatetimeFilter && modifiedDatetimeFilter.values && modifiedDatetimeFilter.values.length > 0) {
      const rangeValue = modifiedDatetimeFilter.values[0]
      if (rangeValue.id && rangeValue.id.startsWith('custom-')) {
        // This is a custom date range — check if it matches a relative pattern
        const idParts = rangeValue.id.replace('custom-', '')
        const firstEndIndex = idParts.indexOf('Z')
        if (firstEndIndex > 0) {
          const startISO = idParts.substring(0, firstEndIndex + 1)
          const endISO = idParts.substring(firstEndIndex + 2)
          const relativePattern = detectRelativeDatePattern(startISO, endISO)

          if (relativePattern) {
            // It's a relative date — auto-open edit dialog
            handleOpenCustomRangeForFilter(modifiedDatetimeFilter.id)
            lastInteractedFilterRef.current = modifiedDatetimeFilter.id
            return
          }
        }
      }
    }
    lastInteractedFilterRef.current = null

    // Strip any custom-range values that might slip through, but keep empty datetime
    // filters so SearchFilter can maintain its intermediate state (user selected the
    // filter type but hasn't picked a preset yet)
    const cleanedFilters = newFilters.map((f) => {
      if (f.type === 'datetime' && f.values?.some((v) => v.id === CUSTOM_RANGE_ID)) {
        return {
          ...f,
          values: f.values?.filter((v) => v.id !== CUSTOM_RANGE_ID),
        }
      }
      return f
    })

    validateFilters(cleanedFilters, setLocalFilters)
  }

  const handleCustomRangeApply = () => {
    if (!customRangeFilterId || !customStartDate || !customEndDate) return

    const baseFilterId = customRangeFilterId.split('__')[0]
    const filterOption = options.find((o) => o.id === baseFilterId)
    if (!filterOption) return

    // Parse as local dates (not UTC) to avoid off-by-one timezone issues
    const start = startOfDay(parse(customStartDate, 'yyyy-MM-dd', new Date()))
    const end = endOfDay(parse(customEndDate, 'yyyy-MM-dd', new Date()))

    // Validate the range
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return

    const currentYear = new Date().getFullYear()
    const endDateFormat = end.getFullYear() === currentYear ? 'MMM d' : 'MMM d, yyyy'
    const dateValue = {
      id: `custom-${start.toISOString()}-${end.toISOString()}`,
      label: `${format(start, 'MMM d')} – ${format(end, endDateFormat)}`,
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

    const updatedFilters = [
      ...localFilters.filter((f) => f.id !== customRangeFilterId),
      newFilter,
    ]

    handleFinish(updatedFilters)

    setCustomRangeFilterId(null)
    setCustomStartDate('')
    setCustomEndDate('')

    // Close the SearchFilter dropdown
    searchFilterRef.current?.close()
  }

  const handleCustomRangeClose = () => {
    setCustomRangeFilterId(null)
    setCustomStartDate('')
    setCustomEndDate('')
  }

  // Find which datetime filter the custom-range click belongs to
  const findActiveDatetimeFilterId = (): string | null => {
    // First check the ref (set when a new datetime filter was added/modified)
    if (activeDatetimeFilterRef.current) {
      return activeDatetimeFilterRef.current
    }

    // Check localFilters for datetime filters — prefer one without values (being edited),
    // then fall back to the most recently added one
    const datetimeFilters = localFilters.filter((f) => f.type === 'datetime')
    const emptyDatetime = datetimeFilters.find((f) => !f.values || f.values.length === 0)
    if (emptyDatetime) return emptyDatetime.id
    if (datetimeFilters.length > 0) return datetimeFilters[datetimeFilters.length - 1].id

    // Last resort: return the first datetime option from available options
    const datetimeOption = options.find((o) => o.type === 'datetime')
    return datetimeOption?.id || null
  }

  // Parse custom date range ID and populate form fields
  const handleOpenCustomRangeForFilter = (filterId: string) => {
    const filter = localFilters.find((f) => f.id === filterId)
    if (!filter || filter.type !== 'datetime' || !filter.values || filter.values.length === 0) {
      // No existing values — open fresh dialog
      setCustomRangeFilterId(filterId)
      setCustomStartDate('')
      setCustomEndDate('')
      return
    }

    const rangeValue = filter.values[0]
    // Check if it's a custom date range (ID format: custom-${startISO}-${endISO})
    if (rangeValue.id && rangeValue.id.startsWith('custom-')) {
      // Extract ISO strings from the custom date ID
      const customId = rangeValue.id as string
      const isoStrings = customId.replace('custom-', '').split('-')

      // Handle the ISO format which contains dashes in the date part
      // Format: 2025-03-05T00:00:00.000Z-2025-03-10T23:59:59.999Z
      // We need to find the split point (the T separates date from time)
      if (isoStrings.length >= 2) {
        // Find where the second ISO date starts (after the first Z)
        const customIdContent = customId.replace('custom-', '')
        const firstEndIndex = customIdContent.indexOf('Z')
        if (firstEndIndex > 0) {
          const startISO = customIdContent.substring(0, firstEndIndex + 1)
          const endISO = customIdContent.substring(firstEndIndex + 2) // skip the dash after Z

          if (startISO && endISO) {
            // Convert to yyyy-MM-dd format for the date input
            const startDate = parse(startISO, "yyyy-MM-dd'T'HH:mm:ss.SSSx", new Date())
            const endDate = parse(endISO, "yyyy-MM-dd'T'HH:mm:ss.SSSx", new Date())

            setCustomStartDate(format(startDate, 'yyyy-MM-dd'))
            setCustomEndDate(format(endDate, 'yyyy-MM-dd'))
            setCustomRangeFilterId(filterId)
            return
          }
        }
      }
    }

    // For non-custom values or if parsing fails, open fresh dialog
    setCustomRangeFilterId(filterId)
    setCustomStartDate('')
    setCustomEndDate('')
  }

  const validateFilters = (filters: Filter[], callback: (filters: Filter[]) => void) => {
    let validFilters = [...filters]

    // Merge multiple text search filters (SEARCH_FILTER_ID) into one filter
    const searchFilters = validFilters.filter((f) => f.id.startsWith(SEARCH_FILTER_ID))
    if (searchFilters.length > 1) {
      // Collect all values and dedupe by id
      const mergedValuesRaw = searchFilters.flatMap((f) => f.values || [])
      const mergedValues = Array.from(
        new Map(mergedValuesRaw.map((v) => [String((v as any).id), v])).values(),
      )

      // Create merged filter; set id to the canonical SEARCH_FILTER_ID so downstream logic treats it as the search filter
      const mergedFilter = { ...searchFilters[0], id: SEARCH_FILTER_ID, values: mergedValues }

      // keep all non-search filters (match any variant that startsWith SEARCH_FILTER_ID) and append the merged search filter
      const nonSearch = validFilters.filter((f) => !f.id.startsWith(SEARCH_FILTER_ID))
      validFilters = [...nonSearch, mergedFilter]
    }

    callback(validFilters)
  }

  const handleFinish = (filters: Filter[]) => {
    // Dropdown closed (or filters committed) — search-chip edit session ends
    editingSearchChipRef.current = null
    validateFilters(filters, (validFilters) => {
      // Convert Filter[] back to QueryFilter and call onChange
      const queryFilter = clientFilterToQueryFilter(validFilters)
      onChange?.(queryFilter)
    })
  }

  const { dropdown, searchBar, ...ptRest } = pt || {}

  // Set the dropdown search input value via native setter to trigger React's
  // controlled onChange inside SearchFilterDropdown
  const prefillDropdownSearch = (text: string) => {
    const container = searchFilterRef.current?.getContainerElement()
    const input = container?.querySelector('ul .search input') as HTMLInputElement | null
    if (!input) return
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set
    if (nativeSetter) {
      nativeSetter.call(input, text)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    input.focus()
    input.select()
  }

  // While editing a search chip, intercept Enter on the dropdown input so the
  // chip's value gets updated (or removed if input is cleared) instead of the
  // default behavior that would create an additional chip or toggle nothing.
  const attachSearchEditEnterHandler = (chipId: string) => {
    const container = searchFilterRef.current?.getContainerElement()
    const input = container?.querySelector('ul .search input') as HTMLInputElement | null
    if (!input) return

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Enter') return
      if (editingSearchChipRef.current !== chipId) return
      ev.preventDefault()
      ev.stopPropagation()
      const text = input.value.trim()
      const currentFilters = localFiltersRef.current
      if (!text) {
        handleFinish(currentFilters.filter((f) => f.id !== chipId))
      } else {
        const updated = currentFilters.map((f) =>
          f.id === chipId ? { ...f, values: [{ id: text, label: text }] } : f,
        )
        handleFinish(updated)
      }
      editingSearchChipRef.current = null
      input.removeEventListener('keydown', onKeyDown, true)
      searchFilterRef.current?.close()
    }

    input.addEventListener('keydown', onKeyDown, true) // capture phase: run before React's bubble handler
  }

  // Intercept clicks on filter chips (search prefill + datetime edit dialog)
  const handleSearchBarClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement

    // Don't intercept clicks on the remove (X) button or include/exclude toggle
    if (target.closest('.remove') || target.closest('.button')) return

    const chipEl = target.closest('.search-filter-item')
    if (!chipEl) return

    // Edit a search chip: let the default edit-mode dropdown open, prefill its
    // input with the chip's current value, and mark this chip as being edited
    // so the input's Enter handler updates it instead of creating a new filter.
    const chipId = chipEl.id
    if (chipId === SEARCH_FILTER_ID || chipId.startsWith(SEARCH_FILTER_ID + '__')) {
      const filter = localFilters.find((f) => f.id === chipId)
      if (filter?.values?.length) {
        const text = filter.values[0].label || String(filter.values[0].id)
        editingSearchChipRef.current = chipId
        // Wait for the dropdown to render (after default click handlers fire)
        requestAnimationFrame(() => {
          prefillDropdownSearch(text)
          attachSearchEditEnterHandler(chipId)
        })
      }
      return
    }

    // Find the label text from the chip (format: "Created At:")
    const labelEl = chipEl.querySelector('.label')
    if (!labelEl) return
    const chipLabel = labelEl.textContent?.replace(/:$/, '').trim()
    if (!chipLabel) return

    // Match against datetime filters in localFilters
    const datetimeFilter = localFilters.find(
      (f) => f.type === 'datetime' && f.label === chipLabel && f.values && f.values.length > 0,
    )

    if (!datetimeFilter) return

    // Check if it's a relative date (Today, This week, etc.) — let dropdown open normally
    const rangeValue = datetimeFilter.values?.[0]
    if (rangeValue?.id) {
      const customIdContent = (rangeValue.id as string).replace('custom-', '')
      const firstZIndex = customIdContent.indexOf('Z')
      if (firstZIndex > 0) {
        const startISO = customIdContent.substring(0, firstZIndex + 1)
        const endISO = customIdContent.substring(firstZIndex + 2)
        if (detectRelativeDatePattern(startISO, endISO)) {
          // Relative date — let SearchFilter handle it (open dropdown)
          return
        }
      }
    }

    // Custom date range — intercept and open the edit dialog
    e.stopPropagation()
    handleOpenCustomRangeForFilter(datetimeFilter.id)
  }

  return (
    <>
      <SearchFilter
        ref={searchFilterRef}
        options={options}
        filters={localFilters}
        onChange={handleFilterChange}
        onFinish={handleFinish} // when changes are applied
        enableMultipleSameFilters={false}
        enableGlobalSearch={true}
        disabledFilters={disabledFilters}
        pt={{
          searchBar: {
            style: {
              paddingRight: 28,
            },
            onClickCapture: handleSearchBarClickCapture,
            ...searchBar,
          },
          dropdown: {
            operationsTemplate: powerLicense ? undefined : (
              <AdvancedFiltersPlaceholder onClick={handlePowerClick} />
            ),
            pt: {
              item: {
                onClick: (event) => {
                  const listItem = (event.target as HTMLLIElement).closest('li')
                  if (!listItem) return true

                  // PowerPack gating
                  if (listItem.querySelector('span[icon="bolt"]')) {
                    return handlePowerClick()
                  }

                  // Custom range: intercept click and open date picker instead
                  if (listItem.querySelector(`span[icon="${CUSTOM_RANGE_ICON}"]`)) {
                    const filterId = findActiveDatetimeFilterId()
                    if (filterId) {
                      handleOpenCustomRangeForFilter(filterId)
                    }
                    return false // prevent SearchFilter from selecting this value
                  }

                  // Auto-fill: if user typed text and then clicked a filter type,
                  // create the filter with that text as value and prevent normal flow
                  // (which would reopen the dropdown to the values panel)
                  const searchInput = listItem.parentElement?.querySelector(
                    '.search input',
                  ) as HTMLInputElement
                  const searchText = searchInput?.value?.trim() || ''

                  if (searchText) {
                    const optionId = listItem.id
                    // Only for top-level filter types (no data-parent = not a value item)
                    const parentAttr = listItem.getAttribute('data-parent')
                    if (!parentAttr) {
                      const matchingOption = options.find((o) => o.id === optionId)
                      if (matchingOption?.allowsCustomValues) {
                        const newId = buildFilterId(optionId)
                        const newFilter: Filter = {
                          id: newId,
                          label: matchingOption.label,
                          type: matchingOption.type,
                          icon: matchingOption.icon,
                          values: [{ id: searchText, label: searchText, isCustom: true }],
                        }

                        handleFinish([...localFilters, newFilter])
                        searchFilterRef.current?.close()
                        return false // prevent SearchFilter from reopening values panel
                      }
                    }
                  }

                  return true
                },
              },
              hasNoOption: {
                contentAfter: powerLicense ? undefined : <Icon icon="bolt" />,
              },
              hasSomeOption: {
                contentAfter: powerLicense ? undefined : <Icon icon="bolt" />,
              },
            },
            ...dropdown,
          },
          ...ptRest,
        }}
        {...props}
      />
      <Dialog
        isOpen={!!customRangeFilterId}
        onClose={handleCustomRangeClose}
        header={options.find((o) => o.id === customRangeFilterId?.split('__')[0])?.label || 'Custom range'}
        size="sm"
        hideCancelButton
        footer={
          <SaveButton
            label="Confirm"
            icon="check"
            onClick={handleCustomRangeApply}
            active={!!customStartDate && !!customEndDate && customEndDate >= customStartDate}
          />
        }
      >
        <DialogBody>
          <FormRow label="Start date">
            <InputDate
              {...{
                selected: customStartDate ? parse(customStartDate, 'yyyy-MM-dd', new Date()) : undefined,
                onChange: (date: Date | null) => setCustomStartDate(date ? format(date, 'yyyy-MM-dd') : ''),
                autoFocus: true,
              } as any}
            />
          </FormRow>
          <FormRow label="End date">
            <InputDate
              {...{
                selected: customEndDate ? parse(customEndDate, 'yyyy-MM-dd', new Date()) : undefined,
                onChange: (date: Date | null) => setCustomEndDate(date ? format(date, 'yyyy-MM-dd') : ''),
                openToDate: customStartDate ? new Date(customStartDate) : undefined,
              } as any}
            />
          </FormRow>
        </DialogBody>
      </Dialog>
    </>
  )
}

export default SearchFilterWrapper
